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
    private readonly atomPool: IRenderAtom[];
    private readonly bondPool: IRenderBond[];
    private readonly renderRadius: Map<string, number>;
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
        this.atomPool = [];
        this.bondPool = [];
        this.renderRadius = new Map();
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
        this.atoms.setGraphMode(this.showGraph);
        this.atoms.update(this.atomBuffer, this.showOrbitals);
        this.atoms.setHaloVisible(this.haloEnabled || this.chargeGlow > 0);
        if (this.showBonds) {
            this.bonds.update(this.bondBuffer, this.quality.getBondStride());
        }
        this.effects.setParticleScale(this.quality.getParticleScale());
        this.effects.update(Math.min(0.05, frameDt));
        this.renderer.render(this.scene, this.camera);
    }

    public screenToWorld(clientX: number, clientY: number, depth: number): THREE.Vector3 {
        this.camera.updateMatrixWorld();
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 1;
        const height = rect.height > 0 ? rect.height : 1;
        const nx = ((clientX - rect.left) / width) * 2 - 1;
        const ny = -((clientY - rect.top) / height) * 2 + 1;
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
        this.camera.updateMatrixWorld();
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 1;
        const height = rect.height > 0 ? rect.height : 1;
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
                const sx = (this.screenVec.x * 0.5 + 0.5) * width;
                const sy = (-this.screenVec.y * 0.5 + 0.5) * height;
                const dx = sx - (clientX - rect.left);
                const dy = sy - (clientY - rect.top);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDistancePx && (best === null || dist < best.distancePx)) {
                    best = { instance: inst, atomIndex: i, distancePx: dist };
                }
            }
        }
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
        const time = this.time;
        const chargeGlow = this.chargeGlow;
        const showBonds = this.showBonds;
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
            const qx = inst.qx;
            const qy = inst.qy;
            const qz = inst.qz;
            const qw = inst.qw;
            for (let i = 0; i < atoms.length; i++) {
                const atom = atoms[i];
                const x = atom.x;
                const y = atom.y;
                const z = atom.z;
                const tx = qw * x + qy * z - qz * y;
                const ty = qw * y + qz * x - qx * z;
                const tz = qw * z + qx * y - qy * x;
                const tw = -qx * x - qy * y - qz * z;
                const rx = tx * qw + tw * -qx + ty * -qz - tz * -qy;
                const ry = ty * qw + tw * -qy + tz * -qx - tx * -qz;
                const rz = tz * qw + tw * -qz + tx * -qy - ty * -qx;
                const phase = inst.jitterSeed + i * 1.7;
                const jx = Math.sin(time * 9 + phase) * jitterAmp;
                const jy = Math.sin(time * 7.3 + phase * 1.3) * jitterAmp;
                const jz = Math.sin(time * 8.1 + phase * 0.7) * jitterAmp;
                this.pushAtom(
                    ix + rx + jx,
                    iy + ry + jy,
                    iz + rz + jz,
                    this.radiusOf(atom.el),
                    atom.el,
                    atom.charge !== 0 ? 0.8 * chargeGlow : 0,
                );
            }
            if (showBonds) {
                const bonds = inst.record.bonds;
                for (let i = 0; i < bonds.length; i++) {
                    const bond = bonds[i];
                    const a = this.atomBuffer[baseIndex + bond.a];
                    const b = this.atomBuffer[baseIndex + bond.b];
                    this.pushBond(
                        a.x,
                        a.y,
                        a.z,
                        b.x,
                        b.y,
                        b.z,
                        bond.order,
                        bond.aromatic,
                        bond.ionic === true,
                    );
                }
            }
        }
    }

    private pushAtom(
        x: number,
        y: number,
        z: number,
        radius: number,
        element: string,
        glow: number,
    ): void {
        const index = this.atomBuffer.length;
        let atom = this.atomPool[index];
        if (atom === undefined) {
            atom = { x: 0, y: 0, z: 0, radius: 0, element: "", glow: 0 };
            this.atomPool[index] = atom;
        }
        atom.x = x;
        atom.y = y;
        atom.z = z;
        atom.radius = radius;
        atom.element = element;
        atom.glow = glow;
        this.atomBuffer.push(atom);
    }

    private pushBond(
        ax: number,
        ay: number,
        az: number,
        bx: number,
        by: number,
        bz: number,
        order: number,
        aromatic: boolean,
        ionic: boolean,
    ): void {
        const index = this.bondBuffer.length;
        let bond = this.bondPool[index];
        if (bond === undefined) {
            bond = {
                ax: 0,
                ay: 0,
                az: 0,
                bx: 0,
                by: 0,
                bz: 0,
                order: 0,
                aromatic: false,
                ionic: false,
            };
            this.bondPool[index] = bond;
        }
        bond.ax = ax;
        bond.ay = ay;
        bond.az = az;
        bond.bx = bx;
        bond.by = by;
        bond.bz = bz;
        bond.order = order;
        bond.aromatic = aromatic;
        bond.ionic = ionic;
        this.bondBuffer.push(bond);
    }

    private radiusOf(element: string): number {
        let radius = this.renderRadius.get(element);
        if (radius === undefined) {
            radius = 0.55;
            try {
                radius = (ElementRegistry.get(element).covalentRadius + 0.25) * 0.62;
            } catch (error) {
                void error;
            }
            this.renderRadius.set(element, radius);
        }
        return radius;
    }
}
