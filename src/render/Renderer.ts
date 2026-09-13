import * as THREE from "three";
import { ElementRegistry } from "../chem/ElementRegistry";
import type { MoleculeInstance } from "../sim/MoleculeInstance";
import { AtomMeshRenderer, type IRenderAtom } from "./AtomMeshRenderer";
import { BondMeshRenderer, type IRenderBond } from "./BondMeshRenderer";
import { CameraController } from "./CameraController";
import { EffectRenderer } from "./EffectRenderer";
import { FramePacer } from "./FramePacer";
import { QualityManager } from "./QualityManager";

export interface IPickResult {
    readonly instance: MoleculeInstance;
    readonly atomIndex: number;
    readonly distancePx: number;
}

export class Renderer {
    private readonly container: HTMLElement;
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly controller: CameraController;
    private readonly atoms: AtomMeshRenderer;
    private readonly bonds: BondMeshRenderer;
    private readonly effects: EffectRenderer;
    private readonly pacer: FramePacer;
    private readonly quality: QualityManager;
    private readonly observer: ResizeObserver;
    private readonly atomBuffer: IRenderAtom[];
    private readonly bondBuffer: IRenderBond[];
    private readonly raycaster: THREE.Raycaster;
    private readonly screenVec: THREE.Vector3;
    private showBonds: boolean;
    private showOrbitals: boolean;
    private showGraph: boolean;
    private chargeGlow: number;
    private haloEnabled: boolean;
    private time: number;

    public constructor(container: HTMLElement) {
        this.container = container;
        this.canvas = document.createElement("canvas");
        this.container.appendChild(this.canvas);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        });
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#07070f");
        this.scene.fog = new THREE.FogExp2(new THREE.Color("#07070f"), 0.0035);
        this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 800);
        this.controller = new CameraController(this.camera);
        this.controller.attach(this.canvas);
        const ambient = new THREE.AmbientLight(new THREE.Color("#8a93b8"), 0.85);
        this.scene.add(ambient);
        const key = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 1.6);
        key.position.set(-30, 40, 25);
        this.scene.add(key);
        const rim = new THREE.DirectionalLight(new THREE.Color("#ace1af"), 0.35);
        rim.position.set(25, -20, -30);
        this.scene.add(rim);
        this.atoms = new AtomMeshRenderer(this.scene);
        this.bonds = new BondMeshRenderer(this.scene);
        this.effects = new EffectRenderer(this.scene);
        this.pacer = new FramePacer();
        this.quality = new QualityManager();
        this.atomBuffer = [];
        this.bondBuffer = [];
        this.raycaster = new THREE.Raycaster();
        this.screenVec = new THREE.Vector3();
        this.showBonds = true;
        this.showOrbitals = false;
        this.showGraph = false;
        this.chargeGlow = 1;
        this.haloEnabled = true;
        this.time = 0;
        this.observer = new ResizeObserver(() => {
            this.resize();
        });
        this.observer.observe(this.container);
        this.resize();
    }

    public getController(): CameraController {
        return this.controller;
    }

    public getEffects(): EffectRenderer {
        return this.effects;
    }

    public getPacer(): FramePacer {
        return this.pacer;
    }

    public getQuality(): QualityManager {
        return this.quality;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public setShowBonds(visible: boolean): void {
        this.showBonds = visible;
        this.bonds.setVisible(visible);
    }

    public setShowOrbitals(visible: boolean): void {
        this.showOrbitals = visible;
    }

    public setShowGraph(visible: boolean): void {
        this.showGraph = visible;
    }

    public setChargeGlow(scale: number): void {
        this.chargeGlow = scale;
    }

    public setHaloEnabled(enabled: boolean): void {
        this.haloEnabled = enabled;
        this.atoms.setHaloVisible(enabled);
    }

    public setGridVisible(visible: boolean): void {
        this.effects.setGridVisible(visible);
    }

    public renderFrame(
        instances: ReadonlyArray<MoleculeInstance>,
        alpha: number,
        frameDt: number,
        temperature: number,
    ): void {
        this.time += frameDt;
        this.buildBuffers(instances, alpha, temperature);
        this.atoms.update(this.atomBuffer, this.showOrbitals || this.showGraph);
        this.atoms.setHaloVisible(this.haloEnabled);
        if (this.showBonds) {
            this.bonds.update(this.bondBuffer, this.quality.getBondStride());
        }
        this.effects.setParticleScale(this.quality.getParticleScale());
        this.effects.update(Math.min(0.05, frameDt));
        this.renderer.render(this.scene, this.camera);
    }

    public screenToWorld(clientX: number, clientY: number, depth: number): THREE.Vector3 {
        const rect = this.canvas.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
        const target = new THREE.Vector3();
        this.raycaster.ray.at(depth, target);
        return target;
    }

    public pickAtom(
        clientX: number,
        clientY: number,
        instances: ReadonlyArray<MoleculeInstance>,
        maxDistancePx: number,
    ): IPickResult | null {
        const rect = this.canvas.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
        let best: IPickResult | null = null;
        for (const inst of instances) {
            if (!inst.alive) {
                continue;
            }
            for (let i = 0; i < inst.record.atoms.length; i++) {
                const atom = inst.record.atoms[i];
                this.screenVec.set(inst.px + atom.x, inst.py + atom.y, inst.pz + atom.z);
                this.screenVec.project(this.camera);
                if (this.screenVec.z > 1) {
                    continue;
                }
                const sx = (this.screenVec.x * 0.5 + 0.5) * rect.width;
                const sy = (-this.screenVec.y * 0.5 + 0.5) * rect.height;
                const dx = sx - (clientX - rect.left);
                const dy = sy - (clientY - rect.top);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDistancePx && (best === null || dist < best.distancePx)) {
                    best = { instance: inst, atomIndex: i, distancePx: dist };
                }
            }
        }
        void nx;
        void ny;
        return best;
    }

    public resize(): void {
        const width = Math.max(1, this.container.clientWidth);
        const height = Math.max(1, this.container.clientHeight);
        const dpr = this.quality.getPixelRatio(window.devicePixelRatio || 1);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    public dispose(): void {
        this.observer.disconnect();
        this.controller.detach();
        this.atoms.dispose();
        this.bonds.dispose();
        this.effects.dispose();
        this.renderer.dispose();
        this.canvas.remove();
    }

    private buildBuffers(
        instances: ReadonlyArray<MoleculeInstance>,
        alpha: number,
        temperature: number,
    ): void {
        this.atomBuffer.length = 0;
        this.bondBuffer.length = 0;
        const jitterAmp = Math.min(0.09, 0.02 + (temperature / 1500) * 0.07);
        for (const inst of instances) {
            if (!inst.alive) {
                continue;
            }
            if (
                !Number.isFinite(
                    inst.px + inst.py + inst.pz + inst.qw + inst.qx + inst.qy + inst.qz,
                )
            ) {
                continue;
            }
            const ix = inst.prevPx + (inst.px - inst.prevPx) * alpha;
            const iy = inst.prevPy + (inst.py - inst.prevPy) * alpha;
            const iz = inst.prevPz + (inst.pz - inst.prevPz) * alpha;
            const baseIndex = this.atomBuffer.length;
            const atoms = inst.record.atoms;
            for (let i = 0; i < atoms.length; i++) {
                const atom = atoms[i];
                const rotated = Renderer.rotateByQuaternion(
                    atom.x,
                    atom.y,
                    atom.z,
                    inst.qx,
                    inst.qy,
                    inst.qz,
                    inst.qw,
                );
                const phase = inst.jitterSeed + i * 1.7;
                const jx = Math.sin(this.time * 9 + phase) * jitterAmp;
                const jy = Math.sin(this.time * 7.3 + phase * 1.3) * jitterAmp;
                const jz = Math.sin(this.time * 8.1 + phase * 0.7) * jitterAmp;
                let radius = 0.55;
                try {
                    radius = (ElementRegistry.get(atom.el).covalentRadius + 0.25) * 0.62;
                } catch (error) {
                    void error;
                }
                this.atomBuffer.push({
                    x: ix + rotated[0] + jx,
                    y: iy + rotated[1] + jy,
                    z: iz + rotated[2] + jz,
                    radius,
                    element: atom.el,
                    glow: atom.charge !== 0 ? 0.8 * this.chargeGlow : 0,
                });
            }
            if (this.showBonds) {
                for (const bond of inst.record.bonds) {
                    const a = this.atomBuffer[baseIndex + bond.a];
                    const b = this.atomBuffer[baseIndex + bond.b];
                    this.bondBuffer.push({
                        ax: a.x,
                        ay: a.y,
                        az: a.z,
                        bx: b.x,
                        by: b.y,
                        bz: b.z,
                        order: bond.order,
                        aromatic: bond.aromatic,
                    });
                }
            }
        }
    }

    private static rotateByQuaternion(
        x: number,
        y: number,
        z: number,
        qx: number,
        qy: number,
        qz: number,
        qw: number,
    ): [number, number, number] {
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        return [
            ix * qw + iw * -qx + iy * -qz - iz * -qy,
            iy * qw + iw * -qy + iz * -qx - ix * -qz,
            iz * qw + iw * -qz + ix * -qy - iy * -qx,
        ];
    }
}
