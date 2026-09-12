import * as THREE from "three";
import { ElementRegistry } from "../chem/ElementRegistry";

export interface IRenderAtom {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly radius: number;
    readonly element: string;
    readonly glow: number;
}

class ElementMesh {
    public mesh: THREE.InstancedMesh;
    public count: number;

    public constructor(mesh: THREE.InstancedMesh) {
        this.mesh = mesh;
        this.count = 0;
    }
}

export class AtomMeshRenderer {
    private readonly scene: THREE.Scene;
    private readonly meshes: Map<string, ElementMesh>;
    private halo: THREE.InstancedMesh | null;
    private readonly matrix: THREE.Matrix4;
    private readonly position: THREE.Vector3;
    private readonly quaternion: THREE.Quaternion;
    private readonly scale: THREE.Vector3;
    private readonly color: THREE.Color;

    public constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.meshes = new Map();
        this.halo = null;
        this.matrix = new THREE.Matrix4();
        this.position = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.scale = new THREE.Vector3();
        this.color = new THREE.Color();
    }

    public update(atoms: ReadonlyArray<IRenderAtom>, showOrbitals: boolean): void {
        const byElement = new Map<string, number[]>();
        for (let i = 0; i < atoms.length; i++) {
            const list = byElement.get(atoms[i].element);
            if (list === undefined) {
                byElement.set(atoms[i].element, [i]);
            } else {
                list.push(i);
            }
        }
        const seen = new Set<string>();
        for (const [element, indices] of byElement) {
            seen.add(element);
            let entry = this.meshes.get(element);
            if (entry === undefined || entry.mesh.instanceMatrix.count < indices.length) {
                entry = this.createElementMesh(element, Math.max(64, indices.length * 2));
                this.meshes.set(element, entry);
            }
            this.fillMesh(entry, atoms, indices);
        }
        for (const [element, entry] of this.meshes) {
            if (!seen.has(element)) {
                entry.mesh.count = 0;
                entry.mesh.instanceMatrix.needsUpdate = true;
            }
        }
        this.updateHalo(atoms, showOrbitals);
    }

    public setVisible(visible: boolean): void {
        for (const entry of this.meshes.values()) {
            entry.mesh.visible = visible;
        }
        if (this.halo !== null) {
            this.halo.visible = visible;
        }
    }

    public setHaloVisible(visible: boolean): void {
        if (this.halo !== null) {
            this.halo.visible = visible;
        }
    }

    public dispose(): void {
        for (const entry of this.meshes.values()) {
            this.scene.remove(entry.mesh);
            entry.mesh.geometry.dispose();
            (entry.mesh.material as THREE.Material).dispose();
        }
        this.meshes.clear();
        if (this.halo !== null) {
            this.scene.remove(this.halo);
            this.halo.geometry.dispose();
            (this.halo.material as THREE.Material).dispose();
            this.halo = null;
        }
    }

    private createElementMesh(element: string, capacity: number): ElementMesh {
        const old = this.meshes.get(element);
        if (old !== undefined) {
            this.scene.remove(old.mesh);
            old.mesh.geometry.dispose();
            (old.mesh.material as THREE.Material).dispose();
        }
        let colorHex = "#8f9bb3";
        try {
            colorHex = ElementRegistry.get(element).color;
        } catch (error) {
            void error;
        }
        const geometry = new THREE.SphereGeometry(1, 14, 10);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            roughness: 0.32,
            metalness: 0.15,
            emissive: new THREE.Color(colorHex),
            emissiveIntensity: 0.12,
        });
        const mesh = new THREE.InstancedMesh(geometry, material, capacity);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        return new ElementMesh(mesh);
    }

    private fillMesh(
        entry: ElementMesh,
        atoms: ReadonlyArray<IRenderAtom>,
        indices: number[],
    ): void {
        const mesh = entry.mesh;
        for (let k = 0; k < indices.length; k++) {
            const atom = atoms[indices[k]];
            this.position.set(atom.x, atom.y, atom.z);
            this.scale.setScalar(Math.max(0.2, atom.radius));
            this.matrix.compose(this.position, this.quaternion, this.scale);
            mesh.setMatrixAt(k, this.matrix);
        }
        mesh.count = indices.length;
        mesh.instanceMatrix.needsUpdate = true;
    }

    private updateHalo(atoms: ReadonlyArray<IRenderAtom>, showOrbitals: boolean): void {
        if (this.halo === null || this.halo.instanceMatrix.count < atoms.length) {
            if (this.halo !== null) {
                this.scene.remove(this.halo);
                this.halo.geometry.dispose();
                (this.halo.material as THREE.Material).dispose();
            }
            const geometry = new THREE.SphereGeometry(1, 10, 8);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ace1af"),
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            this.halo = new THREE.InstancedMesh(geometry, material, Math.max(64, atoms.length * 2));
            this.halo.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            this.halo.frustumCulled = false;
            this.scene.add(this.halo);
        }
        const material = this.halo.material as THREE.MeshBasicMaterial;
        material.wireframe = showOrbitals;
        material.opacity = showOrbitals ? 0.25 : 0.1;
        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];
            this.position.set(atom.x, atom.y, atom.z);
            const boost = 1.3 + atom.glow * 0.9 + (showOrbitals ? 0.5 : 0);
            this.scale.setScalar(Math.max(0.2, atom.radius) * boost);
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.halo.setMatrixAt(i, this.matrix);
        }
        this.halo.count = atoms.length;
        this.halo.instanceMatrix.needsUpdate = true;
        void this.color;
    }
}
