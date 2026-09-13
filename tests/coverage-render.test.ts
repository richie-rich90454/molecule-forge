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
import type { IMoleculeRecord } from "../src/chem/MoleculeRecord";
import { AtomMeshRenderer } from "../src/render/AtomMeshRenderer";
import { CameraController } from "../src/render/CameraController";
import { FramePacer } from "../src/render/FramePacer";
import { QualityManager } from "../src/render/QualityManager";
import { Renderer } from "../src/render/Renderer";
import { MoleculeInstance } from "../src/sim/MoleculeInstance";

function specRecord(id: string): IMoleculeRecord {
    const spec = MoleculeCatalog.buildCompactSpecs().find((item) => item.id === id);
    if (spec === undefined) {
        throw new Error("missing spec: " + id);
    }
    return new MoleculeFactory().build(spec);
}

function makeInstance(x: number, record?: IMoleculeRecord): MoleculeInstance {
    return new MoleculeInstance(record ?? specRecord("alkane-c2"), x, 0, 0, 0, 0, 0, 1);
}

describe("FramePacer coverage", () => {
    it("rolls the fps window after a full second", () => {
        const pacer = new FramePacer();
        pacer.begin(1000);
        pacer.begin(2100);
        expect(pacer.getFps()).toBeGreaterThan(0);
        expect(pacer.getAverageFrameMs()).toBeGreaterThan(0);
    });
});

describe("QualityManager coverage", () => {
    it("holds the level until the under-budget window is long enough", () => {
        const quality = new QualityManager();
        quality.update(20, 1.2);
        quality.update(20, 1.2);
        expect(quality.getLevel()).toBe(2);
        quality.update(5, 1);
        expect(quality.getLevel()).toBe(2);
        quality.update(5, 4);
        expect(quality.getLevel()).toBe(1);
    });
});

describe("CameraController coverage", () => {
    it("toggles navigation and resets non-finite state", () => {
        const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 800);
        const controller = new CameraController(camera);
        const div = document.createElement("div");
        controller.attach(div);

        controller.setNavigationEnabled(false);
        div.dispatchEvent(new MouseEvent("pointerdown", { button: 0, bubbles: true }));
        expect(controller.isDragging()).toBe(false);
        div.dispatchEvent(new MouseEvent("pointerdown", { button: 1, bubbles: true }));
        expect(controller.isPanning()).toBe(true);
        div.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
        controller.setNavigationEnabled(true);
        controller.setNavigationEnabled(false);

        const internals = controller as unknown as { radius: number; target: THREE.Vector3 };
        internals.radius = Number.NaN;
        div.dispatchEvent(
            new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }),
        );
        expect(controller.getRadius()).toBe(55);

        internals.target.x = Number.NaN;
        div.dispatchEvent(
            new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }),
        );
        expect(Number.isFinite(camera.position.x)).toBe(true);
        controller.detach();
    });
});

describe("AtomMeshRenderer coverage", () => {
    it("hides before a halo exists", () => {
        const scene = new THREE.Scene();
        const renderer = new AtomMeshRenderer(scene);
        renderer.setVisible(false);
        renderer.update([{ x: 0, y: 0, z: 0, radius: 0.8, element: "C", glow: 0 }], false);
        renderer.setVisible(true);
        renderer.dispose();
    });
});

describe("Renderer coverage", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    });

    function makeRenderer(): { renderer: Renderer; div: HTMLDivElement } {
        const div = document.createElement("div");
        document.body.appendChild(div);
        return { renderer: new Renderer(div), div };
    }

    it("invokes the resize observer and exposes effects", () => {
        const realObserver = (globalThis as { ResizeObserver: unknown }).ResizeObserver;
        let callback: (() => void) | null = null;
        class CaptureResizeObserver {
            public constructor(handler: () => void) {
                callback = handler;
            }
            public observe(): void {}
            public unobserve(): void {}
            public disconnect(): void {}
        }
        (globalThis as { ResizeObserver: unknown }).ResizeObserver = CaptureResizeObserver;
        try {
            const { renderer, div } = makeRenderer();
            expect(callback).not.toBeNull();
            (callback as (() => void) | null)?.();
            expect(renderer.getEffects()).toBeDefined();
            renderer.dispose();
            div.remove();
        } finally {
            (globalThis as { ResizeObserver: unknown }).ResizeObserver = realObserver;
        }
    });

    it("skips dead instances and renders heavy bonds", () => {
        const { renderer, div } = makeRenderer();
        const alive = makeInstance(0);
        const dead = makeInstance(4);
        dead.alive = false;
        renderer.setShowBonds(true);
        renderer.renderFrame([alive, dead], 0.5, 0.016, 300);
        renderer.pickAtom(0, 0, [dead], 5000);
        renderer.dispose();
        div.remove();
    });

    it("handles non-zero client rects and a zero device pixel ratio", () => {
        const { renderer, div } = makeRenderer();
        const canvas = renderer.getCanvas();
        vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
            width: 800,
            height: 600,
            left: 0,
            top: 0,
            right: 800,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        } as DOMRect);
        Object.defineProperty(window, "devicePixelRatio", { value: 0, configurable: true });
        renderer.resize();
        renderer.pickAtom(400, 300, [makeInstance(0)], 5000);
        renderer.screenToWorld(400, 300, 30);
        renderer.dispose();
        div.remove();
    });
});
