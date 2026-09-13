import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { SoundEngine } from "../src/audio/SoundEngine";
import type {
    IMoleculeRecord,
    IMoleculeRegistry,
    MoleculeCategory,
} from "../src/chem/MoleculeRecord";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { World } from "../src/sim/World";
import { ActionsView } from "../src/ui/ActionsView";
import { AppViewModel } from "../src/ui/AppViewModel";
import { LibraryView } from "../src/ui/LibraryView";
import { LogView } from "../src/ui/LogView";
import { PresetsView } from "../src/ui/PresetsView";
import { SlidersView } from "../src/ui/SlidersView";
import { TabsView } from "../src/ui/TabsView";
import { ThumbnailRenderer } from "../src/ui/ThumbnailRenderer";
import { TogglesView } from "../src/ui/TogglesView";
import { ToolSwitcher } from "../src/ui/ToolSwitcher";

function makeAtom(el: string, x: number, charge: number): IMoleculeRecord["atoms"][number] {
    return { el, x, y: 0, z: 0, charge, stereo: null, aromatic: false };
}

function makeRecord(id: string, warn: boolean, atomCount: number, charge: number): IMoleculeRecord {
    const atoms = [];
    for (let i = 0; i < atomCount; i++) {
        atoms.push(makeAtom("C", i * 1.5, 0));
    }
    if (charge !== 0 && atoms.length > 0) {
        atoms[0] = makeAtom("N", 0, charge);
    }
    return {
        id,
        name: "Test " + id,
        formula: "C" + atomCount,
        smiles: "C",
        inchi: "",
        category: "alkanes",
        tags: warn ? ["toxin"] : [],
        warn,
        mass: atomCount * 12,
        atoms,
        bonds: [],
        properties: { logP: 0, hBondDonors: 0, hBondAcceptors: 0, rotatable: 0, tpsa: 0 },
        provenance: { source: "test", generatorVersion: "0", smilesCanonical: "" },
    };
}

class FakeRegistry implements IMoleculeRegistry {
    private readonly records: IMoleculeRecord[];

    public constructor() {
        const benzene: IMoleculeRecord = {
            ...makeRecord("benzene", false, 6, 0),
            name: "Benzene",
            formula: "C6H6",
            tags: ["aromatic"],
        };
        const sarin: IMoleculeRecord = {
            ...makeRecord("sarin", true, 8, 0),
            name: "Sarin",
            formula: "C4H10FO2P",
            category: "toxins",
            tags: ["toxin"],
        };
        const salt: IMoleculeRecord = {
            ...makeRecord("salt", false, 2, 0),
            name: "Salt",
            formula: "NaCl",
            atoms: [makeAtom("Na", 0, 1), makeAtom("Cl", 2.5, -1)],
        };
        const styrene: IMoleculeRecord = {
            ...makeRecord("styrene", false, 8, 0),
            name: "Styrene",
            formula: "C8H8",
            tags: ["monomer"],
        };
        const polystyrene: IMoleculeRecord = {
            ...makeRecord("polystyrene", false, 48, 0),
            name: "Polystyrene",
            formula: "C48H48",
            tags: ["polymer"],
        };
        const giant: IMoleculeRecord = {
            ...makeRecord("giant", false, 1, 0),
            name: "Giant",
            formula: "CX",
            atoms: new Array(200001).fill(null).map((_, i) => makeAtom("C", i * 0.01, 0)),
        };
        const ethene: IMoleculeRecord = {
            ...makeRecord("ethene", false, 2, 0),
            name: "Ethene",
            formula: "C2H4",
            category: "alkenes",
        };
        const polyethylene: IMoleculeRecord = {
            ...makeRecord("polyethylene", false, 20, 0),
            name: "Polyethylene",
            formula: "C20H40",
            category: "polymers",
            tags: ["polymer"],
        };
        const octane: IMoleculeRecord = {
            ...makeRecord("octane", false, 8, 0),
            name: "Octane",
            formula: "C8H18",
            tags: ["fuel"],
        };
        const oxygen: IMoleculeRecord = {
            ...makeRecord("oxygen", false, 2, 0),
            name: "Oxygen",
            formula: "O2",
            category: "functional",
        };
        const tnt: IMoleculeRecord = {
            ...makeRecord("tnt", false, 10, 0),
            name: "TNT",
            formula: "C7H5N3O6",
            category: "explosives",
            tags: ["explosive"],
        };
        this.records = [
            benzene,
            sarin,
            salt,
            styrene,
            polystyrene,
            giant,
            ethene,
            polyethylene,
            octane,
            oxygen,
            tnt,
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

function makeVm(): {
    vm: AppViewModel;
    world: World;
    sound: SoundEngine;
    effects: { flashCalls: number; burstCalls: number; arrowCalls: number };
} {
    const params = SimParamsFactory.createDefault();
    const engine = new PhysicsEngine(
        [
            new LennardJonesCalculator(2.2, 3),
            new CoulombCalculator(60, 20),
            new HydrogenBondCalculator(3, 3.5),
        ],
        params,
    );
    const world = new World(engine, 11);
    const sound = new SoundEngine();
    const tracker = { flashCalls: 0, burstCalls: 0, arrowCalls: 0 };
    const effects = {
        flash: () => {
            tracker.flashCalls++;
        },
        burst: () => {
            tracker.burstCalls++;
        },
        arrow: () => {
            tracker.arrowCalls++;
        },
    };
    const vm = new AppViewModel(new FakeRegistry(), world, sound, effects);
    vm.initialize();
    return { vm, world, sound, effects: tracker };
}

describe("AppViewModelActions", () => {
    it("initializes and exposes subsystems", () => {
        const { vm, world } = makeVm();
        expect(vm.getRegistry().getCount()).toBe(11);
        expect(vm.getWorld()).toBe(world);
        expect(vm.getPresets().length).toBe(37);
        expect(vm.getSelectedId()).toBe("caffeine");
        expect(vm.getFilteredRecords().length).toBe(6);
    });

    it("publishes reaction events with visuals per kind", () => {
        const { vm, effects } = makeVm();
        vm.publish({
            ruleId: "a",
            message: "boom",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "boom",
        });
        vm.publish({
            ruleId: "b",
            message: "spark",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "spark",
        });
        vm.publish({
            ruleId: "c",
            message: "puff",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "puff",
        });
        expect(effects.flashCalls).toBe(3);
        expect(effects.burstCalls).toBe(3);
        expect(effects.arrowCalls).toBe(3);
        expect(vm.getLog().length).toBe(3);
        vm.setShowArrows(false);
        vm.publish({
            ruleId: "d",
            message: "quiet",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "puff",
        });
        expect(effects.arrowCalls).toBe(3);
    });

    it("caps the log at one hundred entries", () => {
        const { vm } = makeVm();
        for (let i = 0; i < 105; i++) {
            vm.addLog("line " + i, false);
        }
        expect(vm.getLog().length).toBe(100);
    });

    it("selects categories and molecules", () => {
        const { vm } = makeVm();
        vm.selectCategory("aromatics");
        expect(vm.getCategory()).toBe("aromatics");
        vm.selectMolecule("benzene");
        expect(vm.getSelectedId()).toBe("benzene");
        expect(vm.getTool()).toBe("place");
        vm.selectMolecule("missing");
        expect(vm.getSelectedId()).toBe("missing");
    });

    it("syncs slow motion into time scale", () => {
        const { vm, world } = makeVm();
        vm.setSlowMotion(true);
        vm.syncParamsToWorld();
        expect(world.params.timeScale).toBe(0.15);
        vm.setSlowMotion(false);
        vm.setTimeSpeed(2);
        vm.syncParamsToWorld();
        expect(world.params.timeScale).toBe(2);
    });

    it("spawns with guards for missing warn full and budget", () => {
        const { vm, world } = makeVm();
        vm.setSelectedId("missing");
        expect(vm.spawnSelected(0, 0, 0)).toBe(false);
        vm.setSelectedId("sarin");
        vm.setWarnings(false);
        expect(vm.spawnSelected(0, 0, 0)).toBe(false);
        vm.setWarnings(true);
        expect(vm.spawnSelected(0, 0, 0)).toBe(true);
        expect(world.countAlive()).toBe(1);
        vm.removeAt(world.getInstanceList()[0].id);
        expect(world.countAlive()).toBe(0);
        vm.setSelectedId("giant");
        expect(vm.spawnSelected(0, 0, 0)).toBe(false);
    });

    it("adjusts temperature through heat cool freeze", () => {
        const { vm } = makeVm();
        vm.setTemperature(1400);
        vm.heat();
        expect(vm.getTemperature()).toBe(1500);
        vm.setTemperature(100);
        vm.cool();
        expect(vm.getTemperature()).toBe(0);
        vm.freeze();
        expect(vm.getTemperature()).toBe(10);
    });

    it("sparks shakes clears pauses and reseeds", () => {
        const { vm, world } = makeVm();
        vm.spark();
        expect(world.params.spark).toBe(1);
        expect(vm.getTemperature()).toBe(448);
        vm.shake();
        vm.clearWorld();
        expect(world.countAlive()).toBe(0);
        expect(vm.getPaused()).toBe(false);
        vm.togglePause();
        expect(vm.getPaused()).toBe(true);
        vm.togglePause();
        const before = vm.getSeed();
        vm.rerollSeed();
        expect(vm.getSeed()).not.toBe(before);
        vm.catalyze();
        expect(world.params.catalyst).toBe(1);
    });

    it("detonates explosives and ignites fuel mixes", () => {
        const { vm, world } = makeVm();
        vm.detonate();
        expect(vm.getLog().length).toBeGreaterThan(0);
        const octane = vm.getRegistry().findById("octane") as IMoleculeRecord;
        const oxygen = vm.getRegistry().findById("oxygen") as IMoleculeRecord;
        world.spawn(octane, 0, 0, 0, 0);
        world.spawn(oxygen, 1, 0, 0, 0);
        vm.detonate();
        expect(world.params.temperature).toBeGreaterThanOrEqual(950);
        const tnt = vm.getRegistry().findById("tnt") as IMoleculeRecord;
        for (let i = 0; i < 10; i++) {
            world.spawn(tnt, i * 3, 0, 0, 0);
        }
        const before = world.countAlive();
        vm.detonate();
        expect(world.countAlive()).toBeLessThanOrEqual(before);
    });

    it("polymerizes monomers up to the batch cap", () => {
        const { vm, world } = makeVm();
        vm.selectMolecule("glycine");
        vm.polymerize();
        const styrene = vm.getRegistry().findById("styrene") as IMoleculeRecord;
        const ethene = vm.getRegistry().findById("ethene") as IMoleculeRecord;
        for (let i = 0; i < 18; i++) {
            world.spawn(styrene, i, 0, 0, 0);
        }
        for (let i = 0; i < 40; i++) {
            world.spawn(ethene, i, 5, 0, 0);
        }
        vm.polymerize();
        expect(world.findInstances("polystyrene", null, 10).length).toBe(3);
        expect(world.findInstances("polyethylene", null, 10).length).toBe(3);
    });

    it("applies presets and restores the showcase", () => {
        const { vm, world } = makeVm();
        vm.applyPreset("nope");
        expect(vm.getPresetId()).toBe("");
        expect(world.countAlive()).toBe(0);
        vm.applyPreset("primordial-soup");
        expect(vm.getPresetId()).toBe("primordial-soup");
        expect(world.countAlive()).toBe(0);
        vm.applyPreset("combustion-chamber");
        expect(vm.getPresetId()).toBe("combustion-chamber");
        expect(world.countAlive()).toBe(90);
        world.clear();
        vm.spawnShowcase();
        expect(world.countAlive()).toBeGreaterThan(0);
    });

    it("starts from a truly empty preset", () => {
        const { vm, world } = makeVm();
        const empty = vm.getPresets().find((preset) => preset.id === "empty");
        expect(empty?.spawns.length).toBe(0);
        world.spawn(vm.getRegistry().findById("benzene") as IMoleculeRecord, 0, 0, 0, 0);
        vm.applyPreset("empty");
        expect(vm.getPresetId()).toBe("empty");
        expect(world.countAlive()).toBe(0);
    });

    it("writes hashes and copies snapshots", async () => {
        const { vm } = makeVm();
        vm.writeHash();
        expect(window.location.hash.length).toBeGreaterThan(1);
        const clipboard = (navigator as unknown as { clipboard?: unknown }).clipboard;
        (navigator as unknown as { clipboard?: unknown }).clipboard = undefined;
        vm.copySnapshot();
        (
            navigator as unknown as { clipboard?: { writeText: (text: string) => Promise<void> } }
        ).clipboard = {
            writeText: () => Promise.resolve(),
        };
        vm.copySnapshot();
        await Promise.resolve();
        if (clipboard === undefined) {
            delete (navigator as unknown as { clipboard?: unknown }).clipboard;
        } else {
            (navigator as unknown as { clipboard?: unknown }).clipboard = clipboard;
        }
    });

    it("attempts bonds between picked atoms", () => {
        const { vm, world } = makeVm();
        const record = vm.getRegistry().findById("benzene") as IMoleculeRecord;
        const a = world.spawn(record, 0, 0, 0, 0);
        expect(vm.getSelectedAtom()).toBeNull();
        vm.attemptBond(a.id, 0, 0, 0, 0);
        expect(vm.getSelectedAtom()).not.toBeNull();
        vm.attemptBond(a.id, 1, 0, 0, 0);
        expect(vm.getSelectedAtom()).not.toBeNull();
        const b = world.spawn(record, 5, 0, 0, 0);
        vm.attemptBond(99999, 0, 0, 0, 0);
        expect(vm.getSelectedAtom()).not.toBeNull();
        vm.attemptBond(a.id, 0, 0, 0, 0);
        world.remove(a.id);
        vm.attemptBond(b.id, 0, 0, 0, 0);
        expect(vm.getSelectedAtom()).not.toBeNull();
        vm.attemptBond(b.id, 1, 0, 0, 0);
        const c = world.spawn(record, 10, 0, 0, 0);
        const d = world.spawn(record, 15, 0, 0, 0);
        vm.attemptBond(c.id, 0, 0, 0, 0);
        expect(vm.getSelectedAtom()).toBeNull();
        vm.attemptBond(d.id, 0, 1, 1, 1);
        expect(vm.getSelectedAtom()).not.toBeNull();
    });

    it("updates hud numbers", () => {
        const { vm } = makeVm();
        vm.updateHud(120, 2);
        expect(vm.getFps()).toBe(120);
        expect(vm.getQuality()).toBe(2);
    });

    it("selects tools directly", () => {
        const { vm } = makeVm();
        vm.setTool("erase");
        expect(vm.getTool()).toBe("erase");
        vm.setTool("orbit");
        expect(vm.getTool()).toBe("orbit");
    });
});

describe("LibraryViews", () => {
    it("switches categories from tabs", () => {
        const { vm } = makeVm();
        const { unmount } = render(() => TabsView({ vm }));
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBe(17);
        fireEvent.click(buttons[12]);
        expect(vm.getCategory()).toBe("toxins");
        unmount();
    });

    it("selects molecules and honors warning gates", () => {
        const { vm } = makeVm();
        vm.selectCategory("alkanes");
        const { unmount } = render(() => LibraryView({ vm }));
        const cards = screen.getAllByRole("button");
        expect(cards.length).toBe(6);
        fireEvent.click(cards[0]);
        expect(vm.getSelectedId()).toBe("benzene");
        expect(vm.getTool()).toBe("place");
        unmount();
    });

    it("disables warning cards when warnings hide", () => {
        const { vm } = makeVm();
        vm.selectCategory("toxins");
        vm.setWarnings(false);
        const { unmount } = render(() => LibraryView({ vm }));
        const card = screen.getByTitle("Sarin C4H10FO2P") as HTMLButtonElement;
        expect(card.disabled).toBe(true);
        unmount();
    });

    it("shows the log ticker and expands", () => {
        const { vm } = makeVm();
        const { unmount } = render(() => LogView({ vm }));
        expect(screen.queryByText("Reaction Log")).not.toBeNull();
        vm.addLog("hello world", false);
        expect(screen.getByText("hello world")).not.toBeNull();
        const toggle = screen.getByTitle("Collapse or expand the reaction log");
        fireEvent.click(toggle);
        expect(vm.getLogOpen()).toBe(true);
        for (let i = 0; i < 10; i++) {
            vm.addLog("line " + i, i % 2 === 0);
        }
        fireEvent.click(toggle);
        unmount();
    });

    it("opens an explanation from an event log line", () => {
        const { vm } = makeVm();
        vm.publish({
            ruleId: "detonation-tnt",
            message: "TNT detonates.",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "spark",
            deltaH: -1000,
        });
        vm.addLog("Quiet event.", false, {
            ruleId: "detonation-rdx",
            message: "RDX detonates.",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "puff",
        });
        const { unmount } = render(() => LogView({ vm }));
        fireEvent.click(screen.getByTitle("Collapse or expand the reaction log"));
        const lines = screen.getAllByTitle("Explain this reaction");
        expect(lines.length).toBe(2);
        fireEvent.click(lines[0]);
        expect(vm.getPanel()).toBe("explain");
        expect(vm.getExplainReaction()?.ruleId).toBe("detonation-tnt");
        unmount();
    });

    it("moves all sliders", () => {
        const { vm } = makeVm();
        let changes = 0;
        const { unmount } = render(() =>
            SlidersView({
                vm,
                onChange: () => {
                    changes++;
                },
            }),
        );
        const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
        expect(sliders.length).toBe(9);
        for (const slider of sliders) {
            fireEvent.input(slider, { target: { value: slider.max } });
        }
        expect(changes).toBe(9);
        expect(vm.getTemperature()).toBe(1500);
        unmount();
    });

    it("fires every action button", () => {
        const { vm } = makeVm();
        const { unmount } = render(() => ActionsView({ vm }));
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBe(10);
        for (const button of buttons) {
            fireEvent.click(button);
        }
        unmount();
    });

    it("flips every toggle", () => {
        const { vm } = makeVm();
        let changes = 0;
        const { unmount } = render(() =>
            TogglesView({
                vm,
                onChange: () => {
                    changes++;
                },
            }),
        );
        const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
        expect(boxes.length).toBe(10);
        const before = vm.getShowBonds();
        fireEvent.click(boxes[0]);
        expect(vm.getShowBonds()).toBe(!before);
        expect(changes).toBe(1);
        unmount();
    });

    it("applies presets from the selector", () => {
        const { vm } = makeVm();
        const { unmount } = render(() => PresetsView({ vm }));
        const select = screen.getByRole("combobox") as HTMLSelectElement;
        fireEvent.change(select, { target: { value: "" } });
        fireEvent.change(select, { target: { value: "primordial-soup" } });
        expect(vm.getPresetId()).toBe("primordial-soup");
        unmount();
    });

    it("switches canvas tools with live labels", () => {
        const { vm } = makeVm();
        const { unmount } = render(() => ToolSwitcher({ vm }));
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBe(3);
        fireEvent.click(buttons[1]);
        expect(vm.getTool()).toBe("place");
        fireEvent.click(buttons[2]);
        expect(vm.getTool()).toBe("erase");
        fireEvent.click(buttons[0]);
        expect(vm.getTool()).toBe("orbit");
        vm.setSelectedId("missing");
        unmount();
    });
});

describe("ThumbnailRenderer", () => {
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
            save: noop,
            restore: noop,
        } as unknown as CanvasRenderingContext2D;
    }

    it("rotates thumbnails and survives null contexts", () => {
        const renderer = new ThumbnailRenderer();
        const canvas = document.createElement("canvas");
        Object.defineProperty(canvas, "clientWidth", { value: 100, configurable: true });
        Object.defineProperty(canvas, "clientHeight", { value: 74, configurable: true });
        const record = new FakeRegistry().findById("benzene") as IMoleculeRecord;
        renderer.watch(canvas, record);
        renderer.watch(canvas, record);
        const flush = (globalThis as unknown as { __flushAnimationFrames?: (now: number) => void })
            .__flushAnimationFrames;
        if (flush !== undefined) {
            flush(1000);
            flush(1100);
        }
        renderer.unwatch(canvas);
        renderer.unwatch(canvas);
        if (flush !== undefined) {
            flush(1200);
        }
    });

    it("draws with a real context object", () => {
        const renderer = new ThumbnailRenderer();
        const canvas = document.createElement("canvas");
        Object.defineProperty(canvas, "clientWidth", { value: 100, configurable: true });
        Object.defineProperty(canvas, "clientHeight", { value: 74, configurable: true });
        const ctx = fakeContext();
        vi.spyOn(canvas, "getContext").mockReturnValue(ctx);
        const empty: IMoleculeRecord = {
            ...(new FakeRegistry().findById("benzene") as IMoleculeRecord),
            atoms: [],
            bonds: [],
        };
        renderer.watch(canvas, empty);
        const flush = (globalThis as unknown as { __flushAnimationFrames?: (now: number) => void })
            .__flushAnimationFrames;
        if (flush !== undefined) {
            flush(1000);
        }
        const record = new FakeRegistry().findById("benzene") as IMoleculeRecord;
        renderer.watch(canvas, record);
        if (flush !== undefined) {
            flush(1100);
        }
        const zero = document.createElement("canvas");
        renderer.watch(zero, record);
        if (flush !== undefined) {
            flush(1200);
        }
        renderer.unwatch(canvas);
        renderer.unwatch(zero);
    });
});

describe("SoundEngine", () => {
    function fakeAudioContext(): void {
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
            state: "suspended",
            currentTime: 0,
            sampleRate: 44100,
            destination: {},
            resume: () => Promise.resolve(),
            createGain: () => ({ ...gain }),
            createOscillator: () => ({ ...osc }),
            createBuffer: () => buffer,
            createBufferSource: () => ({ ...source }),
        };
        (window as unknown as { AudioContext?: unknown }).AudioContext = function () {
            return context;
        };
    }

    it("stays silent unless enabled with context", () => {
        const sound = new SoundEngine();
        expect(sound.isEnabled()).toBe(false);
        sound.playPop();
        sound.playBlip();
        sound.playWhoosh();
        sound.playBoom();
        sound.playChime();
        sound.setEnabled(true);
        sound.playPop();
        sound.setEnabled(false);
    });

    it("synthesizes tones and noise on a fake context", () => {
        vi.useFakeTimers();
        try {
            fakeAudioContext();
            const sound = new SoundEngine();
            sound.setEnabled(true);
            sound.playPop();
            sound.playBlip();
            sound.playWhoosh();
            sound.playBoom();
            sound.playChime();
            vi.advanceTimersByTime(500);
            sound.setEnabled(false);
        } finally {
            vi.useRealTimers();
            delete (window as unknown as { AudioContext?: unknown }).AudioContext;
        }
    });
});
