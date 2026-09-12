import * as THREE from "three";

export interface IRenderBond {
    readonly ax: number;
    readonly ay: number;
    readonly az: number;
    readonly bx: number;
    readonly by: number;
    readonly bz: number;
    readonly order: number;
    readonly aromatic: boolean;
}

export class BondMeshRenderer {
    private readonly scene: THREE.Scene;
    private readonly meshes: Map<string, THREE.InstancedMesh>;
    private readonly matrix: THREE.Matrix4;
    private readonly position: THREE.Vector3;
    private readonly quaternion: THREE.Quaternion;
    private readonly scale: THREE.Vector3;
    private readonly dir: THREE.Vector3;
    private readonly side: THREE.Vector3;
    private readonly up: THREE.Vector3;

    public constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.meshes = new Map();
        this.matrix = new THREE.Matrix4();
        this.position = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.scale = new THREE.Vector3();
        this.dir = new THREE.Vector3();
        this.side = new THREE.Vector3();
        this.up = new THREE.Vector3(0, 1, 0);
    }

    public update(bonds: ReadonlyArray<IRenderBond>, stride: number): void {
        const buckets = new Map<string, IRenderBond[]>();
        for (let i = 0; i < bonds.length; i += stride) {
            const bond = bonds[i];
            const key = bond.aromatic ? "aromatic" : "order" + bond.order;
            const list = buckets.get(key);
            if (list === undefined) {
                buckets.set(key, [bond]);
            } else {
                list.push(bond);
            }
        }
        const seen = new Set<string>();
        for (const [key, list] of buckets) {
            seen.add(key);
            const linesPerBond =
                key === "order1" ? 1 : key === "aromatic" ? 2 : key === "order2" ? 2 : 3;
            this.ensureMesh(key, list.length * linesPerBond);
            const mesh = this.meshes.get(key) as THREE.InstancedMesh;
            let slot = 0;
            for (const bond of list) {
                slot = this.writeBond(mesh, slot, bond, linesPerBond);
            }
            mesh.count = slot;
            mesh.instanceMatrix.needsUpdate = true;
        }
        for (const [key, mesh] of this.meshes) {
            if (!seen.has(key)) {
                mesh.count = 0;
                mesh.instanceMatrix.needsUpdate = true;
            }
        }
    }

    public setVisible(visible: boolean): void {
        for (const mesh of this.meshes.values()) {
            mesh.visible = visible;
        }
    }

    public dispose(): void {
        for (const mesh of this.meshes.values()) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        }
        this.meshes.clear();
    }

    private ensureMesh(key: string, capacity: number): void {
        const existing = this.meshes.get(key);
        if (existing !== undefined && existing.instanceMatrix.count >= capacity) {
            return;
        }
        if (existing !== undefined) {
            this.scene.remove(existing);
            existing.geometry.dispose();
            (existing.material as THREE.Material).dispose();
        }
        const geometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#bcd2ff"),
            roughness: 0.5,
            metalness: 0.05,
            emissive: new THREE.Color("#223355"),
            emissiveIntensity: 0.4,
        });
        const mesh = new THREE.InstancedMesh(geometry, material, Math.max(64, capacity * 2));
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        this.meshes.set(key, mesh);
    }

    private writeBond(
        mesh: THREE.InstancedMesh,
        slot: number,
        bond: IRenderBond,
        lines: number,
    ): number {
        this.dir.set(bond.bx - bond.ax, bond.by - bond.ay, bond.bz - bond.az);
        const length = this.dir.length();
        if (length < 1e-6) {
            return slot;
        }
        this.dir.multiplyScalar(1 / length);
        this.side.crossVectors(this.dir, this.up);
        if (this.side.lengthSq() < 1e-6) {
            this.side.set(1, 0, 0);
        } else {
            this.side.normalize();
        }
        this.quaternion.setFromUnitVectors(this.up, this.dir);
        const offsets: number[] = lines === 1 ? [0] : lines === 2 ? [-0.14, 0.14] : [-0.2, 0, 0.2];
        for (const offset of offsets) {
            const mx = (bond.ax + bond.bx) / 2 + this.side.x * offset;
            const my = (bond.ay + bond.by) / 2 + this.side.y * offset;
            const mz = (bond.az + bond.bz) / 2 + this.side.z * offset;
            this.position.set(mx, my, mz);
            this.scale.set(0.11, length, 0.11);
            this.matrix.compose(this.position, this.quaternion, this.scale);
            mesh.setMatrixAt(slot, this.matrix);
            slot++;
        }
        return slot;
    }
}
