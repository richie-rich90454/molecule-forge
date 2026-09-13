import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
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

import { SoundEngine } from "../src/audio/SoundEngine";
import { Application } from "../src/Application";
import type {
    IMoleculeRecord,
    IMoleculeRegistry,
    MoleculeCategory,
} from "../src/chem/MoleculeRecord";
import type { IPreset } from "../src/presets/PresetCatalog";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { SnapshotCodec } from "../src/state/SnapshotCodec";
import { World } from "../src/sim/World";
import { AppShell } from "../src/ui/AppShell";
import { AppViewModel } from "../src/ui/AppViewModel";
import { LibraryView } from "../src/ui/LibraryView";
import { ThumbnailRenderer } from "../src/ui/ThumbnailRenderer";
import { ToolSwitcher } from "../src/ui/ToolSwitcher";

function makeAtom(el: string, x: number, charge: number): IMoleculeRecord["atoms"][number] {
    return { el, x, y: 0, z: 0, charge, stereo: null, aromatic: false };
}

function carbonChain(count: number): IMoleculeRecord["atoms"] {
    return new Array(count).fill(null).map((_, index) => makeAtom("C", index * 1.5, 0));
}

function makeRecord(id: string, overrides: Partial<IMoleculeRecord> = {}): IMoleculeRecord {
    return {
        id,
        name: "Test " + id,
        formula: "C1",
        smiles: "C",
        inchi: "",
        category: "alkanes",
        tags: [],
        warn: false,
        mass: 12.011,
        atoms: [makeAtom("C", 0, 0)],
        bonds: [],
        properties: { logP: 0, hBondDonors: 0, hBondAcceptors: 0, rotatable: 0, tpsa: 0 },
        provenance: { source: "test", generatorVersion: "0", smilesCanonical: "" },
        ...overrides,
    };
}

class FakeRegistry implements IMoleculeRegistry {
    private readonly records: IMoleculeRecord[];

    public constructor() {
        this.records = [
            makeRecord("caffeine", { name: "Caffeine", formula: "C8H10N4O2" }),
            makeRecord("benzene", { name: "Benzene", formula: "C6H6", category: "aromatics" }),
            makeRecord("sarin", {
                name: "Sarin",
                formula: "C4H10FO2P",
                category: "toxins",
                warn: true,
                tags: ["toxin"],
            }),
            makeRecord("octane", { name: "Octane", formula: "C8H18", tags: ["fuel"] }),
            makeRecord("oxygen", { name: "Oxygen", formula: "O2", category: "functional" }),
            makeRecord("tnt", {
                name: "TNT",
                formula: "C7H5N3O6",
                category: "explosives",
                tags: ["explosive"],
            }),
            makeRecord("styrene", {
                name: "Styrene",
                formula: "C8H8",
                tags: ["monomer"],
                atoms: carbonChain(8),
            }),
            makeRecord("polystyrene", {
                name: "Polystyrene",
                formula: "C48H48",
                tags: ["polymer"],
                atoms: carbonChain(48),
            }),
        ];
    }

    public getCategories(): ReadonlyArray<MoleculeCategory> {
        return ["alkanes", "aromatics", "toxins"];
    }

    public getRecords(category: MoleculeCategory): ReadonlyArray<IMoleculeRecord> {
        return this.records.filter((record) => record.category === category);
    }

    public getAllRecords(): ReadonlyArray<IMoleculeRecord> {
        return this.records;
    }

    public findById(id: string): IMoleculeRecord | undefined {
        return this.records.find((record) => record.id === id);
    }

    public getCount(): number {
        return this.records.length;
    }
}

function makeVm(): { vm: AppViewModel; world: World } {
    const engine = new PhysicsEngine(
        [
            new LennardJonesCalculator(2.2, 3),
            new CoulombCalculator(60, 20),
            new HydrogenBondCalculator(3, 3.5),
        ],
        SimParamsFactory.createDefault(),
    );
    const world = new World(engine, 11);
    const effects = { flash: () => {}, burst: () => {}, arrow: () => {} };
    const vm = new AppViewModel(new FakeRegistry(), world, new SoundEngine(), effects);
    vm.initialize();
    return { vm, world };
}

function makePreset(overrides: Partial<IPreset>): IPreset {
    return {
        id: "synthetic",
        name: "Synthetic",
        description: "test",
        seed: 1,
        spawns: [],
        conditions: {},
        ...overrides,
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe("ThumbnailRenderer coverage", () => {
    function fakeContext(): CanvasRenderingContext2D {
        const noop = (): void => {};
        return {
            clearRect: noop,
            beginPath: noop,
            moveTo: noop,
            lineTo: noop,
            stroke: noop,
            arc: noop,
            fill: noop,
        } as unknown as CanvasRenderingContext2D;
    }

    function sizedCanvas(width: number, height: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        Object.defineProperty(canvas, "clientWidth", { value: width, configurable: true });
        Object.defineProperty(canvas, "clientHeight", { value: height, configurable: true });
        return canvas;
    }

    it("tracks visibility through an intersection observer", () => {
        const realObserver = (globalThis as { IntersectionObserver?: unknown })
            .IntersectionObserver;
        interface FakeEntry {
            target: Element;
            isIntersecting: boolean;
        }
        class FakeObserver {
            public static last: FakeObserver | null = null;
            public readonly callback: (entries: FakeEntry[]) => void;
            public constructor(callback: (entries: FakeEntry[]) => void) {
                this.callback = callback;
                FakeObserver.last = this;
            }
            public observe(): void {}
            public unobserve(): void {}
            public disconnect(): void {}
        }
        (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
        Object.defineProperty(window, "devicePixelRatio", { value: 0, configurable: true });
        vi.useFakeTimers();
        try {
            const renderer = new ThumbnailRenderer();
            const canvas = sizedCanvas(120, 90);
            vi.spyOn(canvas, "getContext").mockReturnValue(fakeContext());
            const record = makeRecord("benzene", {
                atoms: [makeAtom("C", 0, 0), makeAtom("Xx", 2, 1), makeAtom("Xx", 4, 0)],
                bonds: [
                    { a: 0, b: 1, order: 1, aromatic: false, stereo: null },
                    { a: 1, b: 2, order: 1, aromatic: false, stereo: null, ionic: true },
                    { a: 0, b: 9, order: 1, aromatic: false, stereo: null },
                ],
            });
            renderer.watch(canvas, record);
            const observer = FakeObserver.last;
            expect(observer).not.toBeNull();
            observer?.callback([{ target: canvas, isIntersecting: false }]);
            observer?.callback([
                { target: document.createElement("canvas"), isIntersecting: true },
            ]);
            vi.advanceTimersByTime(16);
            observer?.callback([{ target: canvas, isIntersecting: true }]);
            vi.advanceTimersByTime(16);
            renderer.watch(canvas, record);
            vi.advanceTimersByTime(16);
            renderer.unwatch(canvas);
        } finally {
            (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = realObserver;
            Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
        }
    });

    it("handles zero size, null context, and empty atoms", () => {
        const renderer = new ThumbnailRenderer();
        vi.useFakeTimers();
        try {
            const zero = sizedCanvas(0, 0);
            const record = makeRecord("empty", { atoms: [], bonds: [] });
            renderer.watch(zero, record);
            vi.advanceTimersByTime(16);
            renderer.unwatch(zero);

            const nullCanvas = sizedCanvas(80, 80);
            vi.spyOn(nullCanvas, "getContext").mockReturnValue(null);
            renderer.watch(nullCanvas, record);
            vi.advanceTimersByTime(16);
            renderer.unwatch(nullCanvas);

            const emptyCanvas = sizedCanvas(80, 80);
            vi.spyOn(emptyCanvas, "getContext").mockReturnValue(fakeContext());
            renderer.watch(emptyCanvas, record);
            vi.advanceTimersByTime(16);
            renderer.unwatch(emptyCanvas);

            const idle = new ThumbnailRenderer();
            (idle as unknown as { tick(now: number): void }).tick(1000);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("AppViewModel coverage", () => {
    it("refuses to spawn when the chamber is full", () => {
        const { vm, world } = makeVm();
        vi.spyOn(world, "getInstanceCount").mockReturnValue(2500);
        expect(vm.spawnSelected(0, 0, 0)).toBe(false);
        expect(vm.getLog().some((entry) => entry.text.includes("chamber is full"))).toBe(true);
    });

    it("detonates pure explosives without a fuel mix", () => {
        const { vm, world } = makeVm();
        const tnt = vm.getRegistry().findById("tnt") as IMoleculeRecord;
        world.spawn(tnt, 0, 0, 0, 0);
        vm.detonate();
        expect(vm.getLog().some((entry) => entry.text.includes("Detonation"))).toBe(true);
    });

    it("shakes spawned molecules", () => {
        const { vm, world } = makeVm();
        const caffeine = vm.getRegistry().findById("caffeine") as IMoleculeRecord;
        const inst = world.spawn(caffeine, 0, 0, 0, 0);
        vm.shake();
        expect(Number.isFinite(inst.vx)).toBe(true);
    });

    it("applies every preset condition field", () => {
        const { vm } = makeVm();
        (vm as unknown as { presets: IPreset[] }).presets = [
            makePreset({
                spawns: [{ moleculeId: "caffeine", count: 1 }],
                conditions: {
                    temperature: 500,
                    pressure: 2,
                    ph: 3,
                    viscosity: 0.9,
                    polarity: 0.1,
                    gravity: 1,
                    catalyst: 0.5,
                },
            }),
        ];
        vm.applyPreset("synthetic");
        expect(vm.getTemperature()).toBe(500);
        expect(vm.getPressure()).toBe(2);
        expect(vm.getPh()).toBe(3);
        expect(vm.getViscosity()).toBe(0.9);
        expect(vm.getPolarity()).toBe(0.1);
        expect(vm.getGravity()).toBe(1);
    });

    it("applies a preset with no optional conditions", () => {
        const { vm } = makeVm();
        (vm as unknown as { presets: IPreset[] }).presets = [
            makePreset({ spawns: [{ moleculeId: "caffeine", count: 1 }] }),
        ];
        vm.applyPreset("synthetic");
        expect(vm.getPresetId()).toBe("synthetic");
    });

    it("stops preset spawning at the atom budget and instance cap", () => {
        const first = makeVm();
        (first.vm as unknown as { presets: IPreset[] }).presets = [
            makePreset({ spawns: [{ moleculeId: "caffeine", count: 3 }] }),
        ];
        vi.spyOn(first.world, "canAccommodate").mockReturnValue(false);
        first.vm.applyPreset("synthetic");
        expect(first.world.countAlive()).toBe(0);

        const second = makeVm();
        (second.vm as unknown as { presets: IPreset[] }).presets = [
            makePreset({ spawns: [{ moleculeId: "caffeine", count: 3 }] }),
        ];
        vi.spyOn(second.world, "canAccommodate").mockReturnValue(true);
        vi.spyOn(second.world, "getInstanceCount").mockReturnValue(2500);
        second.vm.applyPreset("synthetic");
        expect(second.vm.getPresetId()).toBe("synthetic");
    });

    it("stops polymerization at the atom budget", () => {
        const { vm, world } = makeVm();
        const styrene = vm.getRegistry().findById("styrene") as IMoleculeRecord;
        for (let i = 0; i < 6; i++) {
            world.spawn(styrene, i, 0, 0, 0);
        }
        vi.spyOn(world, "canAccommodate").mockReturnValue(false);
        vm.polymerize();
        expect(vm.getLog().some((entry) => entry.text.includes("Atom budget"))).toBe(true);
    });

    it("stops the showcase when the atom budget is exhausted", () => {
        const { vm, world } = makeVm();
        vi.spyOn(world, "canAccommodate").mockReturnValue(false);
        vm.spawnShowcase();
        expect(world.countAlive()).toBe(0);
    });
});

describe("LibraryView and ToolSwitcher coverage", () => {
    it("marks a warn card as selected", () => {
        const { vm } = makeVm();
        vm.selectCategory("toxins");
        vm.setSelectedId("sarin");
        const { unmount } = render(() => LibraryView({ vm }));
        const card = screen.getByTitle("Sarin C4H10FO2P");
        expect(card.className).toContain("mf-warn");
        expect(card.className).toContain("mf-selected");
        unmount();
    });

    it("marks a normal card as selected", () => {
        const { vm } = makeVm();
        vm.selectCategory("alkanes");
        vm.setSelectedId("caffeine");
        const { unmount } = render(() => LibraryView({ vm }));
        const card = screen.getByTitle("Caffeine C8H10N4O2");
        expect(card.className).toContain("mf-selected");
        unmount();
    });

    it("labels the place tool generically for a missing selection", () => {
        const { vm } = makeVm();
        vm.setSelectedId("missing");
        const { unmount } = render(() => ToolSwitcher({ vm }));
        const labels = screen.getAllByRole("button").map((button) => button.textContent);
        expect(labels).toContain("Place");
        unmount();
    });
});

describe("AppShell coverage", () => {
    it("renders chrome and wires callbacks", () => {
        const { vm } = makeVm();
        const mounted: HTMLElement[] = [];
        let controls = 0;
        const callbacks = {
            onCanvasMount: (element: HTMLElement): void => {
                mounted.push(element);
            },
            onResetCamera: () => {},
            onControlsChange: () => {
                controls++;
            },
        };
        const { unmount } = render(() => AppShell({ vm, callbacks }));
        expect(mounted.length).toBe(1);
        const pause = screen.getByTitle("Pause or resume");
        expect(pause.textContent).toBe("Pause");
        fireEvent.click(pause);
        expect(pause.textContent).toBe("Play");
        fireEvent.click(screen.getByTitle("Reroll seed"));
        fireEvent.click(screen.getByTitle("Reset camera"));
        fireEvent.click(screen.getAllByRole("checkbox")[0]);
        expect(controls).toBeGreaterThan(0);
        unmount();
    });
});

describe("SoundEngine coverage", () => {
    function installContext(state: string, throwOnCreate: boolean = false): void {
        const gain = {
            gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
        };
        const osc = {
            type: "",
            frequency: { value: 0 },
            connect: () => {},
            start: () => {},
            stop: () => {},
        };
        const buffer = { getChannelData: () => new Float32Array(10) };
        const source = { buffer: null, connect: () => {}, start: () => {} };
        const context = {
            state,
            currentTime: 0,
            sampleRate: 44100,
            destination: {},
            resume: () => Promise.resolve(),
            createGain: () => ({ ...gain }),
            createOscillator: () => ({ ...osc }),
            createBuffer: () => buffer,
            createBufferSource: () => ({ ...source }),
        };
        const Ctor = function (): unknown {
            if (throwOnCreate) {
                throw new Error("no audio");
            }
            return context;
        };
        (window as unknown as { AudioContext?: unknown }).AudioContext = Ctor;
    }

    it("survives a throwing audio context", () => {
        installContext("running", true);
        const sound = new SoundEngine();
        sound.setEnabled(true);
        sound.playPop();
        delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    });

    it("skips resume when the context is running", () => {
        installContext("running");
        const sound = new SoundEngine();
        sound.setEnabled(true);
        sound.playPop();
        sound.setEnabled(false);
        delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    });

    it("guards tone and noise when the master gain is gone", () => {
        installContext("running");
        const sound = new SoundEngine();
        sound.setEnabled(true);
        (sound as unknown as { master: null }).master = null;
        sound.playPop();
        sound.playBoom();
        delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    });
});

function pointerEvent(
    type: string,
    options: { clientX?: number; clientY?: number; button?: number; buttons?: number },
): MouseEvent {
    const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: options.clientX ?? 0,
        clientY: options.clientY ?? 0,
        button: options.button ?? 0,
    });
    Object.defineProperty(event, "buttons", { value: options.buttons ?? 0 });
    Object.defineProperty(event, "pointerId", { value: 1 });
    return event;
}

function installApplication(root: HTMLElement): Application {
    const app = new Application(root);
    (app.getViewModel().getWorld() as unknown as { boxSize: number }).boxSize = 60;
    return app;
}

describe("Application coverage", () => {
    it("handles null renderer paths before start", () => {
        const root = document.createElement("div");
        document.body.appendChild(root);
        const app = installApplication(root);
        expect(app.getViewModel()).toBeDefined();
        app.flash(0, 0, 0, "#fff", 4);
        app.burst(0, 0, 0, "puff", 1);
        app.arrow(0, 0, 0);
        const internals = app as unknown as {
            applyControls(): void;
            frame(now: number): void;
            attachCanvas(element: HTMLElement | null | undefined): void;
        };
        internals.applyControls();
        internals.frame(0);
        internals.attachCanvas(null);
        internals.attachCanvas(undefined);
        app.stop();
        root.remove();
    });

    it("starts, drives input, and runs frames", () => {
        vi.useFakeTimers();
        try {
            window.location.hash = "";
            const root = document.createElement("div");
            document.body.appendChild(root);
            const app = installApplication(root);
            app.start();
            const renderer = (
                app as unknown as { renderer: import("../src/render/Renderer").Renderer | null }
            ).renderer;
            expect(renderer).not.toBeNull();
            if (renderer === null) {
                return;
            }
            const canvas = renderer.getCanvas();
            (canvas as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture =
                () => {};

            app.flash(0, 0, 0, "#fff", 4);
            app.burst(0, 0, 0, "puff", 1);
            app.arrow(0, 0, 0);
            app.getViewModel().setShowArrows(false);
            app.arrow(0, 0, 0);

            const instance = app.getViewModel().getWorld().getInstanceList()[0];
            vi.spyOn(renderer, "pickAtom").mockReturnValue({
                instance,
                atomIndex: 0,
                distancePx: 0,
            });
            vi.spyOn(renderer, "screenToWorld").mockReturnValue(new THREE.Vector3(0, 0, 0));
            (app as unknown as { lastPaint: number }).lastPaint = -1000;

            canvas.dispatchEvent(new MouseEvent("contextmenu", { cancelable: true }));
            canvas.dispatchEvent(pointerEvent("pointermove", { clientX: 5, clientY: 5 }));

            const vm = app.getViewModel();

            vm.setTool("erase");
            (app as unknown as { lastPaint: number }).lastPaint = -1000;
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 30, clientY: 10, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 30, clientY: 10 }));

            vm.setTool("place");
            (app as unknown as { lastPaint: number }).lastPaint = -1000;
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 40, clientY: 40, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 40, clientY: 40 }));

            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 12, clientY: 12 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 12, clientY: 12 }));

            canvas.dispatchEvent(
                pointerEvent("pointerdown", { clientX: 12, clientY: 12, button: 2 }),
            );
            canvas.dispatchEvent(
                pointerEvent("pointerup", { clientX: 12, clientY: 12, button: 2 }),
            );

            vm.setTool("orbit");
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 14, clientY: 14 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 14, clientY: 14 }));

            canvas.dispatchEvent(
                pointerEvent("pointerdown", { clientX: 14, clientY: 14, button: 1 }),
            );
            canvas.dispatchEvent(
                pointerEvent("pointerup", { clientX: 14, clientY: 14, button: 1 }),
            );

            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(pointerEvent("pointermove", { clientX: 12, clientY: 10 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 12, clientY: 10 }));

            vm.setTool("erase");
            (app as unknown as { lastPaint: number }).lastPaint = Number.MAX_SAFE_INTEGER;
            renderer.pickAtom = vi
                .fn()
                .mockReturnValue(null) as unknown as typeof renderer.pickAtom;
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 40, clientY: 10, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 40, clientY: 10 }));

            (app as unknown as { lastPaint: number }).lastPaint = -1000;
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 40, clientY: 10, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 40, clientY: 10 }));

            vm.setTool("place");
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 12, clientY: 10, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 12, clientY: 10 }));
            (app as unknown as { lastPaint: number }).lastPaint = Number.MAX_SAFE_INTEGER;
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 10, clientY: 10 }));
            canvas.dispatchEvent(
                pointerEvent("pointermove", { clientX: 45, clientY: 45, buttons: 1 }),
            );
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 45, clientY: 45 }));

            vm.setTool("orbit");
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 16, clientY: 16 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 16, clientY: 16 }));

            vm.setTool("erase");
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 20, clientY: 20 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 20, clientY: 20 }));

            (vm as unknown as { setTool(tool: string): void }).setTool("noop");
            canvas.dispatchEvent(pointerEvent("pointerdown", { clientX: 22, clientY: 22 }));
            canvas.dispatchEvent(pointerEvent("pointerup", { clientX: 22, clientY: 22 }));

            fireEvent.click(screen.getByTitle("Pause or resume"));
            fireEvent.click(screen.getByTitle("Reroll seed"));
            fireEvent.click(screen.getByTitle("Reset camera"));
            fireEvent.click(screen.getAllByRole("checkbox")[0]);
            fireEvent.input(screen.getAllByRole("slider")[0], { target: { value: "400" } });

            const internals = app as unknown as {
                applyControls(): void;
                attachCanvas(element: HTMLElement | null): void;
            };
            vm.setShowCharges(false);
            internals.applyControls();
            internals.attachCanvas(canvas);
            vm.setPaused(false);

            vi.advanceTimersByTime(600);
            vm.clearWorld();
            vi.advanceTimersByTime(300);
            (renderer.getQuality() as unknown as { level: number }).level = 4;
            vi.advanceTimersByTime(50);
            vm.setPaused(true);
            vi.advanceTimersByTime(50);

            app.stop();
            vi.advanceTimersByTime(50);
            root.remove();
        } finally {
            vi.useRealTimers();
        }
    });

    it("restores a snapshot with spawns, preset, and an unknown molecule", () => {
        const withSpawns = SnapshotCodec.encode({
            version: 1,
            preset: "",
            seed: 5,
            temperature: 400,
            pressure: 1,
            ph: 7,
            viscosity: 0.2,
            polarity: 0.5,
            gravity: 0,
            spawns: [
                { id: "alkane-c1", count: 2 },
                { id: "no-such-molecule", count: 1 },
            ],
        });
        vi.useFakeTimers();
        try {
            window.location.hash = "#" + withSpawns;
            const root = document.createElement("div");
            const app = installApplication(root);
            app.start();
            expect(app.getViewModel().getTemperature()).toBe(400);
            app.stop();
        } finally {
            vi.useRealTimers();
        }

        const withPreset = SnapshotCodec.encode({
            version: 1,
            preset: "primordial-soup",
            seed: 1,
            temperature: 300,
            pressure: 1,
            ph: 7,
            viscosity: 0.2,
            polarity: 0.5,
            gravity: 0,
            spawns: [],
        });
        vi.useFakeTimers();
        try {
            window.location.hash = "#" + withPreset;
            const root = document.createElement("div");
            const app = installApplication(root);
            app.start();
            expect(app.getViewModel().getPresetId()).toBe("primordial-soup");
            app.stop();
        } finally {
            vi.useRealTimers();
        }

        const unknownPreset = SnapshotCodec.encode({
            version: 1,
            preset: "no-such-preset",
            seed: 1,
            temperature: 300,
            pressure: 1,
            ph: 7,
            viscosity: 0.2,
            polarity: 0.5,
            gravity: 0,
            spawns: [{ id: "alkane-c1", count: 1 }],
        });
        vi.useFakeTimers();
        try {
            window.location.hash = "#" + unknownPreset;
            const root = document.createElement("div");
            const app = installApplication(root);
            app.start();
            expect(app.getViewModel().getPresetId()).toBe("");
            app.stop();
        } finally {
            vi.useRealTimers();
            window.location.hash = "";
        }
    });
});
