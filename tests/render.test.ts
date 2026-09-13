import { beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";

vi.mock("three", async (importOriginal) => {
    const actual = await importOriginal<typeof import("three")>();
    class FakeWebGLRenderer {
        public constructor(_params: unknown) {
            void _params;
        }
        public setPixelRatio(_ratio: number): void {
            void _ratio;
        }
        public setSize(_width: number, _height: number, _updateStyle: boolean): void {
            void _width;
            void _height;
            void _updateStyle;
        }
        public render(_scene: unknown, _camera: unknown): void {
            void _scene;
            void _camera;
        }
        public dispose(): void {}
    }
    return { ...actual, WebGLRenderer: FakeWebGLRenderer };
});

import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { AtomMeshRenderer } from "../src/render/AtomMeshRenderer";
import { BondMeshRenderer } from "../src/render/BondMeshRenderer";
import { CameraController } from "../src/render/CameraController";
import { EffectRenderer } from "../src/render/EffectRenderer";
import { FramePacer } from "../src/render/FramePacer";
import { QualityManager } from "../src/render/QualityManager";
import { Renderer } from "../src/render/Renderer";
import { MoleculeInstance } from "../src/sim/MoleculeInstance";
import type { IMoleculeRecord } from "../src/chem/MoleculeRecord";

function methaneRecord(): IMoleculeRecord {
    const factory = new MoleculeFactory();
    const spec = MoleculeCatalog.buildCompactSpecs().find((item) => item.id === "alkane-c1");
    if (spec === undefined) {
        throw new Error("missing methane");
    }
    return factory.build(spec);
}

function makeInstance(x: number, record?: IMoleculeRecord): MoleculeInstance {
    return new MoleculeInstance(record ?? methaneRecord(), x, 0, 0, 0, 0, 0, 1);
}

describe("FramePacer", () => {
    it("starts idle and emits capped steps", () => {
        const pacer = new FramePacer();
        expect(pacer.begin(1000)).toBe(0);
        expect(pacer.alpha).toBe(0);
        expect(pacer.begin(500)).toBe(0);
        const steps = pacer.begin(1500);
        expect(steps).toBe(FramePacer.MAX_STEPS);
        expect(pacer.alpha).toBe(0);
    });

    it("measures fps over a window", () => {
        const pacer = new FramePacer();
        pacer.begin(0);
        pacer.begin(1100);
        expect(pacer.getFps()).toBeGreaterThan(0);
        expect(pacer.getAverageFrameMs()).toBeGreaterThan(0);
        pacer.reset();
        expect(pacer.alpha).toBe(0);
    });
});

describe("QualityManager", () => {
    it("starts full and degrades stepwise under load", () => {
        const quality = new QualityManager();
        expect(quality.getLevel()).toBe(0);
        expect(quality.isBloomEnabled()).toBe(true);
        expect(quality.getParticleScale()).toBe(1);
        expect(quality.getBondStride()).toBe(1);
        expect(quality.getPixelRatio(3)).toBe(3);
        expect(quality.getPixelRatio(8)).toBe(4);
        for (let level = 1; level <= 5; level++) {
            quality.update(20, 0.6);
            quality.update(20, 0.6);
            expect(quality.getLevel()).toBe(level);
        }
        quality.update(20, 5);
        expect(quality.getLevel()).toBe(5);
        expect(quality.isBloomEnabled()).toBe(false);
        expect(quality.getParticleScale()).toBe(0.5);
        expect(quality.getBondStride()).toBe(2);
        expect(quality.getPixelRatio(4)).toBe(1);
    });

    it("recovers when headroom returns", () => {
        const quality = new QualityManager();
        quality.update(20, 1.2);
        expect(quality.getLevel()).toBe(1);
        expect(quality.getPixelRatio(4)).toBe(4);
        expect(quality.getPixelRatio(2)).toBe(2);
        quality.update(20, 1.2);
        expect(quality.getLevel()).toBe(2);
        expect(quality.getPixelRatio(4)).toBe(2);
        quality.update(5, 5);
        expect(quality.getLevel()).toBe(1);
        quality.update(8, 1);
        expect(quality.getLevel()).toBe(1);
    });

    it("honors manual bloom overrides", () => {
        const quality = new QualityManager();
        quality.setManualBloom(false);
        expect(quality.getLevel()).toBe(1);
        quality.setManualBloom(true);
        expect(quality.getLevel()).toBe(0);
        quality.update(20, 1.2);
        quality.update(20, 1.2);
        expect(quality.getLevel()).toBe(2);
        quality.setManualBloom(true);
        expect(quality.getLevel()).toBe(2);
        quality.setManualBloom(false);
        expect(quality.getLevel()).toBe(2);
    });

    it("reports intermediate pixel ratios", () => {
        const quality = new QualityManager();
        for (let i = 0; i < 3; i++) {
            quality.update(20, 1.2);
        }
        expect(quality.getLevel()).toBe(3);
        expect(quality.getPixelRatio(4)).toBe(1.5);
        quality.update(20, 1.2);
        expect(quality.getLevel()).toBe(4);
        expect(quality.getPixelRatio(4)).toBe(1.25);
    });
});

describe("CameraController", () => {
    function makeController(): { controller: CameraController; div: HTMLDivElement } {
        const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 800);
        const controller = new CameraController(camera);
        const div = document.createElement("div");
        return { controller, div };
    }

    function mouseDown(
        target: HTMLElement,
        options: { button?: number; shiftKey?: boolean; clientX?: number; clientY?: number },
    ): void {
        target.dispatchEvent(
            new MouseEvent("pointerdown", {
                button: options.button ?? 0,
                shiftKey: options.shiftKey ?? false,
                clientX: options.clientX ?? 10,
                clientY: options.clientY ?? 10,
                bubbles: true,
            }),
        );
    }

    function mouseMove(target: HTMLElement, x: number, y: number): void {
        target.dispatchEvent(
            new MouseEvent("pointermove", { clientX: x, clientY: y, bubbles: true }),
        );
    }

    function mouseUp(target: HTMLElement): void {
        target.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    }

    it("orbits on left drag and zooms on wheel", () => {
        const { controller, div } = makeController();
        controller.attach(div);
        const before = controller.getRadius();
        mouseDown(div, {});
        expect(controller.isDragging()).toBe(true);
        mouseMove(div, 60, 40);
        mouseUp(div);
        expect(controller.isDragging()).toBe(false);
        div.dispatchEvent(
            new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }),
        );
        expect(controller.getRadius()).toBeGreaterThan(before);
        div.dispatchEvent(
            new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }),
        );
        controller.detach();
        controller.detach();
    });

    it("pans on middle, right, and shift drags", () => {
        const { controller, div } = makeController();
        controller.attach(div);
        controller.attach(div);
        mouseDown(div, { button: 1 });
        expect(controller.isPanning()).toBe(true);
        mouseMove(div, 20, 20);
        mouseUp(div);
        mouseDown(div, { button: 2 });
        mouseMove(div, 5, 5);
        mouseUp(div);
        mouseDown(div, { shiftKey: true });
        mouseMove(div, 5, 5);
        mouseUp(div);
        expect(controller.isPanning()).toBe(false);
        controller.detach();
    });

    it("ignores moves without drag and clamps zoom", () => {
        const { controller, div } = makeController();
        controller.attach(div);
        mouseMove(div, 30, 30);
        for (let i = 0; i < 60; i++) {
            div.dispatchEvent(
                new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }),
            );
        }
        expect(controller.getRadius()).toBe(220);
        for (let i = 0; i < 80; i++) {
            div.dispatchEvent(
                new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }),
            );
        }
        expect(controller.getRadius()).toBe(6);
        controller.reset();
        expect(controller.getRadius()).toBe(55);
        controller.detach();
    });
});

describe("AtomMeshRenderer", () => {
    it("builds per element meshes and disposes", () => {
        const scene = new THREE.Scene();
        const renderer = new AtomMeshRenderer(scene);
        const record = methaneRecord();
        const atoms = record.atoms.map((atom) => ({
            x: atom.x,
            y: atom.y,
            z: atom.z,
            radius: 0.8,
            element: atom.el,
            glow: atom.charge !== 0 ? 1 : 0,
        }));
        renderer.update(atoms.slice(0, 1), false);
        renderer.update(atoms, false);
        renderer.update(atoms, true);
        const grown = [];
        for (let i = 0; i < 100; i++) {
            grown.push({ x: i * 0.1, y: 0, z: 0, radius: 0.8, element: "C", glow: 0 });
        }
        renderer.update(grown, false);
        renderer.update(atoms, false);
        renderer.setVisible(false);
        renderer.setVisible(true);
        renderer.setHaloVisible(false);
        renderer.dispose();
        renderer.dispose();
        const fresh = new AtomMeshRenderer(scene);
        fresh.dispose();
    });

    it("falls back for unknown elements and empty scenes", () => {
        const scene = new THREE.Scene();
        const renderer = new AtomMeshRenderer(scene);
        renderer.update([{ x: 0, y: 0, z: 0, radius: 0.05, element: "Xx", glow: 0 }], false);
        renderer.update([], false);
        renderer.dispose();
    });
});

describe("BondMeshRenderer", () => {
    function sampleBonds(): Array<{
        ax: number;
        ay: number;
        az: number;
        bx: number;
        by: number;
        bz: number;
        order: number;
        aromatic: boolean;
        ionic?: boolean;
    }> {
        return [
            { ax: 0, ay: 0, az: 0, bx: 1.5, by: 0, bz: 0, order: 1, aromatic: false },
            { ax: 0, ay: 0, az: 2, bx: 1.3, by: 0, bz: 2, order: 2, aromatic: false },
            { ax: 0, ay: 0, az: 4, bx: 1.2, by: 0, bz: 4, order: 3, aromatic: false },
            { ax: 0, ay: 0, az: 6, bx: 1.4, by: 0, bz: 6, order: 4, aromatic: true },
            { ax: 5, ay: 5, az: 5, bx: 5, by: 5, bz: 5, order: 1, aromatic: false },
            { ax: 0, ay: 0, az: 8, bx: 0, by: 2, bz: 8, order: 1, aromatic: false },
            { ax: 0, ay: 0, az: 10, bx: 2, by: 0, bz: 10, order: 1, aromatic: false, ionic: true },
        ];
    }

    it("renders every bond kind and stride", () => {
        const scene = new THREE.Scene();
        const renderer = new BondMeshRenderer(scene);
        renderer.update(sampleBonds(), 1);
        renderer.update(sampleBonds(), 1);
        const big: ReturnType<typeof sampleBonds> = [];
        for (let i = 0; i < 40; i++) {
            big.push(...sampleBonds());
        }
        renderer.update(big, 1);
        renderer.update(sampleBonds(), 2);
        renderer.update([], 1);
        renderer.setVisible(false);
        renderer.setVisible(true);
        renderer.dispose();
        renderer.dispose();
    });
});

describe("EffectRenderer", () => {
    it("plays flashes bursts trails arrows and grid", () => {
        const scene = new THREE.Scene();
        const effects = new EffectRenderer(scene);
        effects.setParticleScale(1);
        effects.setGridVisible(true);
        effects.setGridVisible(false);
        for (let i = 0; i < 33; i++) {
            effects.spawnFlash(i, 0, 0, "#ffffff", 4);
        }
        effects.spawnBurst(0, 0, 0, "boom", 7);
        effects.spawnBurst(0, 0, 0, "spark", 7);
        effects.spawnBurst(0, 0, 0, "link", 7);
        effects.spawnBurst(0, 0, 0, "crystal", 7);
        effects.spawnBurst(0, 0, 0, "fold", 7);
        effects.spawnBurst(0, 0, 0, "puff", 7);
        effects.setParticleScale(0.5);
        effects.spawnBurst(0, 0, 0, "boom", 7);
        for (let i = 0; i < 2005; i++) {
            effects.addTrailPoint(i * 0.01, 0, 0);
        }
        effects.update(0.1);
        effects.update(1.0);
        effects.dispose();
    });

    it("shows and clears arrows on a timer", () => {
        vi.useFakeTimers();
        try {
            const scene = new THREE.Scene();
            const effects = new EffectRenderer(scene);
            effects.showArrow(0, 0, 0);
            effects.showArrow(1, 1, 1);
            vi.advanceTimersByTime(2000);
            effects.dispose();
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("RendererFacade", () => {
    function makeRenderer(): { renderer: Renderer; div: HTMLDivElement } {
        const div = document.createElement("div");
        document.body.appendChild(div);
        const renderer = new Renderer(div);
        return { renderer, div };
    }

    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("renders instances with interpolation and toggles", () => {
        const { renderer, div } = makeRenderer();
        const a = makeInstance(0);
        const b = makeInstance(5);
        b.prevPx = 4;
        renderer.setShowBonds(true);
        renderer.setShowOrbitals(true);
        renderer.setShowGraph(true);
        renderer.setChargeGlow(1);
        renderer.setHaloEnabled(true);
        renderer.setGridVisible(true);
        renderer.renderFrame([a, b], 0.5, 0.016, 300);
        renderer.setShowBonds(false);
        renderer.setHaloEnabled(false);
        renderer.setChargeGlow(0);
        renderer.renderFrame([a, b], 0.5, 0.016, 300);
        expect(renderer.getCanvas()).toBeDefined();
        expect(renderer.getController().getRadius()).toBe(55);
        expect(renderer.getPacer().alpha).toBeGreaterThanOrEqual(0);
        expect(renderer.getQuality().getLevel()).toBe(0);
        renderer.getController().reset();
        renderer.resize();
        renderer.dispose();
        div.remove();
    });

    it("renders charged and unknown atoms plus skips broken state", () => {
        const { renderer, div } = makeRenderer();
        const record = methaneRecord();
        const salt = new MoleculeInstance(
            {
                ...record,
                atoms: [
                    { el: "Na", x: 0, y: 0, z: 0, charge: 1, stereo: null, aromatic: false },
                    { el: "Xx", x: 2, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                ],
                bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null, ionic: true }],
            },
            0,
            0,
            0,
            0,
            0,
            0,
            1,
        );
        const broken = makeInstance(10);
        broken.px = Number.NaN;
        renderer.renderFrame([salt, broken], 0.5, 0.016, 300);
        renderer.dispose();
        div.remove();
    });

    it("picks atoms and converts screen points", () => {
        const { renderer, div } = makeRenderer();
        Object.defineProperty(div, "clientWidth", { value: 800, configurable: true });
        Object.defineProperty(div, "clientHeight", { value: 600, configurable: true });
        renderer.resize();
        const inst = makeInstance(0);
        const hit = renderer.pickAtom(400, 300, [inst], 5000);
        expect(hit).not.toBeNull();
        expect(hit?.instance).toBe(inst);
        const miss = renderer.pickAtom(400, 300, [], 22);
        expect(miss).toBeNull();
        const corner = renderer.pickAtom(795, 595, [inst], 5);
        expect(corner).toBeNull();
        const behind = makeInstance(0);
        behind.px = 200;
        behind.py = 160;
        behind.pz = 240;
        expect(renderer.pickAtom(400, 300, [behind], 5000)).toBeNull();
        const point = renderer.screenToWorld(400, 300, 30);
        expect(Number.isFinite(point.x)).toBe(true);
        renderer.dispose();
        div.remove();
    });
});
