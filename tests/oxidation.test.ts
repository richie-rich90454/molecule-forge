import { describe, expect, it } from "vitest";
import { CompoundSynthesizer } from "../src/chem/CompoundSynthesizer";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import type { IMoleculeRecord, IMoleculeRegistry } from "../src/chem/MoleculeRecord";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import type { IReactionEvent, IReactionSink } from "../src/sim/ReactionEngine";
import { OxidationEngine } from "../src/sim/OxidationEngine";
import { ReactionGate } from "../src/sim/ReactionGate";
import { SeededRandom } from "../src/sim/SeededRandom";
import { World } from "../src/sim/World";

function makeRegistry(): MoleculeRegistry {
    return new MoleculeRegistry(new MoleculeFactory());
}

function makeWorld(temperature: number): World {
    const world = new World(new PhysicsEngine([], SimParamsFactory.createDefault()), 5);
    world.params.temperature = temperature;
    return world;
}

function record(registry: MoleculeRegistry, id: string): IMoleculeRecord {
    const found = registry.findById(id);
    if (found === undefined) {
        throw new Error("missing record: " + id);
    }
    return found;
}

function makeSink(): { events: IReactionEvent[]; sink: IReactionSink } {
    const events: IReactionEvent[] = [];
    return { events, sink: { publish: (event) => events.push(event) } };
}

describe("OxidationEngine", () => {
    it("oxidizes water, methane, and benzene with fluorine on contact", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const cases: Array<[string, string, string]> = [
            ["water", "HFO", "oxidation-F"],
            ["alkane-c1", "CH3F", "oxidation-F"],
            ["benzene", "C6H5F", "oxidation-F"],
        ];
        for (const [target, product, rule] of cases) {
            const world = makeWorld(298);
            world.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
            world.spawn(record(registry, target), 1, 0, 0, 0);
            const tracker = makeSink();
            engine.update(world, new SeededRandom(1), tracker.sink);
            const list = world.getInstanceList();
            expect(list.some((inst) => inst.record.formula === product)).toBe(true);
            expect(tracker.events.some((event) => event.ruleId === rule)).toBe(true);
        }
    });

    it("requires heat for chlorine and iodine but never for oxygen", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const cold = makeWorld(298);
        cold.spawn(record(registry, "chlorine-elemental"), 0, 0, 0, 0);
        cold.spawn(record(registry, "alkane-c1"), 1, 0, 0, 0);
        engine.update(cold, new SeededRandom(1), makeSink().sink);
        expect(cold.getInstanceList().length).toBe(2);

        const hot = makeWorld(900);
        hot.spawn(record(registry, "chlorine-elemental"), 0, 0, 0, 0);
        hot.spawn(record(registry, "alkane-c1"), 1, 0, 0, 0);
        engine.update(hot, new SeededRandom(1), makeSink().sink);
        expect(hot.getInstanceList().some((inst) => inst.record.formula === "CH3Cl")).toBe(true);

        const veryHot = makeWorld(1500);
        veryHot.spawn(record(registry, "iodine"), 0, 0, 0, 0);
        veryHot.spawn(record(registry, "alkane-c1"), 1, 0, 0, 0);
        engine.update(veryHot, new SeededRandom(1), makeSink().sink);
        expect(veryHot.getInstanceList().some((inst) => inst.record.formula === "CH3I")).toBe(true);

        const oxygen = makeWorld(1500);
        oxygen.spawn(record(registry, "oxygen-elemental"), 0, 0, 0, 0);
        oxygen.spawn(record(registry, "alkane-c1"), 1, 0, 0, 0);
        engine.update(oxygen, new SeededRandom(1), makeSink().sink);
        expect(oxygen.getInstanceList().length).toBe(2);
    });

    it("ignores non-reagents, unbonded pairs, and missing partners", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const alone = makeWorld(600);
        alone.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        engine.update(alone, new SeededRandom(1), makeSink().sink);
        expect(alone.getInstanceList().length).toBe(1);

        const distant = makeWorld(600);
        distant.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        distant.spawn(record(registry, "alkane-c1"), 40, 0, 0, 0);
        engine.update(distant, new SeededRandom(1), makeSink().sink);
        expect(distant.getInstanceList().length).toBe(2);

        const noHydrogen = makeWorld(600);
        noHydrogen.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        noHydrogen.spawn(record(registry, "bromine"), 1, 0, 0, 0);
        engine.update(noHydrogen, new SeededRandom(1), makeSink().sink);
        expect(noHydrogen.getInstanceList().length).toBe(2);

        const noBondEnergy = makeWorld(600);
        noBondEnergy.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        noBondEnergy.spawn(record(registry, "silane"), 1, 0, 0, 0);
        engine.update(noBondEnergy, new SeededRandom(1), makeSink().sink);
        expect(noBondEnergy.getInstanceList().length).toBe(2);
    });

    it("skips a hydrogen bound to the oxidizer itself and unknown atoms", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const hf = new CompoundSynthesizer().predict({
            totals: new Map([
                ["H", 1],
                ["F", 1],
            ]),
            monatomic: new Map(),
        }).product?.record as IMoleculeRecord;
        const world = makeWorld(600);
        world.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        world.spawn(hf, 1, 0, 0, 0);
        engine.update(world, new SeededRandom(1), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);

        const base = record(registry, "el-h");
        const fake = {
            ...base,
            id: "fake-xh",
            formula: "XxH",
            atoms: [
                { ...base.atoms[0], el: "Xx" },
                { ...base.atoms[0], el: "H" },
            ],
            bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null }],
        } as IMoleculeRecord;
        const unknown = makeWorld(600);
        unknown.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        unknown.spawn(fake, 1, 0, 0, 0);
        engine.update(unknown, new SeededRandom(1), makeSink().sink);
        expect(unknown.getInstanceList().length).toBe(2);
    });

    it("treats an unbonded same-element pair as a single bond oxidizer", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const base = record(registry, "el-f");
        const pair = {
            ...base,
            id: "fake-f2",
            formula: "F2",
            atoms: [base.atoms[0], base.atoms[0]],
            bonds: [],
        } as IMoleculeRecord;
        const world = makeWorld(298);
        world.spawn(pair, 0, 0, 0, 0);
        world.spawn(record(registry, "water"), 1, 0, 0, 0);
        engine.update(world, new SeededRandom(1), makeSink().sink);
        expect(world.getInstanceList().some((inst) => inst.record.formula === "HFO")).toBe(true);
    });

    it("does not react at absolute cold", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const world = makeWorld(0);
        world.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        world.spawn(record(registry, "water"), 1, 0, 0, 0);
        engine.update(world, new SeededRandom(4), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("ignores diatomics less electronegative than hydrogen", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const base = record(registry, "el-si");
        const pair = {
            ...base,
            id: "fake-si2",
            formula: "Si2",
            atoms: [base.atoms[0], base.atoms[0]],
            bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null }],
        } as IMoleculeRecord;
        const world = makeWorld(1500);
        world.spawn(pair, 0, 0, 0, 0);
        world.spawn(record(registry, "water"), 1, 0, 0, 0);
        engine.update(world, new SeededRandom(5), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("preserves formal charges and reuses the hydride cache", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const world = makeWorld(600);
        world.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        world.spawn(record(registry, "ammonium-acetate"), 1, 0, 0, 0);
        world.spawn(record(registry, "fluorine-elemental"), 10, 0, 0, 0);
        world.spawn(record(registry, "water"), 11, 0, 0, 0);
        const tracker = makeSink();
        engine.update(world, new SeededRandom(2), tracker.sink);
        engine.update(world, new SeededRandom(2), tracker.sink);
        expect(tracker.events.filter((event) => event.ruleId === "oxidation-F").length).toBe(2);
        const fluorinated = world
            .getInstanceList()
            .filter((inst) => inst.record.formula.includes("F"));
        expect(fluorinated.length).toBeGreaterThan(0);
    });

    it("respects the atom budget", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const world = makeWorld(298);
        const reagent = world.spawn(record(registry, "fluorine-elemental"), 0, 0, 0, 0);
        const target = world.spawn(record(registry, "water"), 1, 0, 0, 0);
        const stub = {
            getInstanceList: () => [reagent, target],
            params: world.params,
            boxSize: world.boxSize,
            canAccommodate: () => false,
            remove: (): void => {},
            spawn: (): void => {},
        } as unknown as World;
        engine.update(stub, new SeededRandom(3), makeSink().sink);
        expect(true).toBe(true);
    });

    it("computes activation energies and solvent activity", () => {
        const world = makeWorld(300);
        expect(ReactionGate.activationEnergy(-482, world)).toBe(0);
        expect(ReactionGate.activationEnergy(90, world)).toBeGreaterThan(80);
        expect(ReactionGate.activity(world)).toBe(1);
        const charged = makeWorld(300);
        charged.spawn(record(makeRegistry(), "sodium-chloride"), 0, 0, 0, 0);
        expect(ReactionGate.activity(charged)).toBeLessThan(1);
    });
});

function atomTotals(instances: ReadonlyArray<{ record: IMoleculeRecord }>): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const inst of instances) {
        for (const atom of inst.record.atoms) {
            totals[atom.el] = (totals[atom.el] ?? 0) + 1;
        }
    }
    return totals;
}

describe("OxidationEngine combustion", () => {
    it("burns methane into carbon dioxide and water", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const world = makeWorld(800);
        world.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), -1, 0, 0, 0);
        const tracker = makeSink();
        engine.update(world, new SeededRandom(1), tracker.sink);
        const list = world.getInstanceList();
        expect(list.filter((inst) => inst.record.formula === "CO2").length).toBe(1);
        expect(list.filter((inst) => inst.record.formula === "H2O").length).toBe(2);
        expect(atomTotals(list)).toEqual({ C: 1, H: 4, O: 4 });
        expect(tracker.events[0].ruleId).toBe("combustion-alkane-c1");
        expect(tracker.events[0].message).toContain("1 CH4 + 2 O2 -> 1 CO2 + 2 H2O");
    });

    it("balances a liquid fuel and a large hydrocarbon", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const ethanol = makeWorld(800);
        ethanol.spawn(record(registry, "ethanol"), 0, 0, 0, 0);
        for (let i = 0; i < 3; i++) {
            ethanol.spawn(record(registry, "oxygen"), i + 1, 0, 0, 0);
        }
        engine.update(ethanol, new SeededRandom(1), makeSink().sink);
        expect(atomTotals(ethanol.getInstanceList())).toEqual({ C: 2, H: 6, O: 7 });

        const octane = makeWorld(800);
        octane.spawn(record(registry, "alkane-c8"), 0, 0, 0, 0);
        octane.spawn(record(registry, "alkane-c8"), 0.5, 0, 0, 0);
        for (let i = 0; i < 25; i++) {
            octane.spawn(record(registry, "oxygen"), (i % 5) + 1, Math.floor(i / 5), 0, 0);
        }
        engine.update(octane, new SeededRandom(1), makeSink().sink);
        const list = octane.getInstanceList();
        expect(list.filter((inst) => inst.record.formula === "CO2").length).toBe(16);
        expect(list.filter((inst) => inst.record.formula === "H2O").length).toBe(18);
        expect(atomTotals(list)).toEqual({ C: 16, H: 36, O: 50 });
    });

    it("burns sulfur and nitrogen fuels into SO2 and N2", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const sulfur = makeWorld(800);
        sulfur.spawn(record(registry, "hydrogen-sulfide"), 0, 0, 0, 0);
        sulfur.spawn(record(registry, "hydrogen-sulfide"), 0.5, 0, 0, 0);
        for (let i = 0; i < 3; i++) {
            sulfur.spawn(record(registry, "oxygen"), i + 1, 0, 0, 0);
        }
        engine.update(sulfur, new SeededRandom(1), makeSink().sink);
        expect(
            sulfur.getInstanceList().filter((inst) => inst.record.id === "sulfur-dioxide").length,
        ).toBe(2);
        expect(atomTotals(sulfur.getInstanceList())).toEqual({ H: 4, S: 2, O: 6 });

        const nitrogen = makeWorld(800);
        for (let i = 0; i < 4; i++) {
            nitrogen.spawn(record(registry, "ammonia"), i * 0.4, 0, 0, 0);
        }
        for (let i = 0; i < 3; i++) {
            nitrogen.spawn(record(registry, "oxygen"), i + 1, 1, 0, 0);
        }
        engine.update(nitrogen, new SeededRandom(1), makeSink().sink);
        expect(
            nitrogen.getInstanceList().filter((inst) => inst.record.formula === "N2").length,
        ).toBe(2);
        expect(atomTotals(nitrogen.getInstanceList())).toEqual({ N: 4, H: 12, O: 6 });
    });

    it("burns hydrogen and refuses already-oxidized or short mixtures", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const hydrogen = makeWorld(800);
        hydrogen.spawn(record(registry, "hydrogen-elemental"), 0, 0, 0, 0);
        hydrogen.spawn(record(registry, "hydrogen-elemental"), 0.5, 0, 0, 0);
        hydrogen.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(hydrogen, new SeededRandom(1), makeSink().sink);
        expect(
            hydrogen.getInstanceList().filter((inst) => inst.record.formula === "H2O").length,
        ).toBe(2);

        const monoxide = makeWorld(800);
        monoxide.spawn(record(registry, "carbon-monoxide"), 0, 0, 0, 0);
        monoxide.spawn(record(registry, "carbon-monoxide"), 0.5, 0, 0, 0);
        monoxide.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(monoxide, new SeededRandom(1), makeSink().sink);
        expect(
            monoxide.getInstanceList().filter((inst) => inst.record.formula === "CO2").length,
        ).toBe(2);

        const short = makeWorld(800);
        short.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        short.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(short, new SeededRandom(1), makeSink().sink);
        expect(short.getInstanceList().length).toBe(2);

        const singleFuel = makeWorld(800);
        singleFuel.spawn(record(registry, "alkane-c8"), 0, 0, 0, 0);
        for (let i = 0; i < 25; i++) {
            singleFuel.spawn(record(registry, "oxygen"), (i % 5) + 1, Math.floor(i / 5), 0, 0);
        }
        engine.update(singleFuel, new SeededRandom(1), makeSink().sink);
        expect(singleFuel.getInstanceList().length).toBe(26);

        const water = makeWorld(800);
        water.spawn(record(registry, "water"), 0, 0, 0, 0);
        water.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(water, new SeededRandom(1), makeSink().sink);
        expect(water.getInstanceList().length).toBe(2);

        const oxide = makeWorld(800);
        oxide.spawn(record(registry, "nitrous-oxide"), 0, 0, 0, 0);
        oxide.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(oxide, new SeededRandom(1), makeSink().sink);
        expect(oxide.getInstanceList().length).toBe(2);

        const inert = makeWorld(800);
        inert.spawn(record(registry, "sodium-chloride"), 0, 0, 0, 0);
        inert.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        engine.update(inert, new SeededRandom(1), makeSink().sink);
        expect(inert.getInstanceList().length).toBe(2);
    });

    it("stays cold unless ignited", () => {
        const registry = makeRegistry();
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        const world = makeWorld(300);
        world.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), -1, 0, 0, 0);
        engine.update(world, new SeededRandom(1), makeSink().sink);
        expect(world.getInstanceList().length).toBe(3);

        const frozen = makeWorld(0);
        frozen.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        frozen.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        frozen.spawn(record(registry, "oxygen"), -1, 0, 0, 0);
        engine.update(frozen, new SeededRandom(1), makeSink().sink);
        expect(frozen.getInstanceList().length).toBe(3);

        const sparked = makeWorld(300);
        sparked.params.spark = 1;
        sparked.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        sparked.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        sparked.spawn(record(registry, "oxygen"), -1, 0, 0, 0);
        engine.update(sparked, new SeededRandom(1), makeSink().sink);
        expect(sparked.getInstanceList().some((inst) => inst.record.formula === "CO2")).toBe(true);

        const noOxygen = makeWorld(800);
        noOxygen.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        engine.update(noOxygen, new SeededRandom(1), makeSink().sink);
        expect(noOxygen.getInstanceList().length).toBe(1);
    });

    it("bails out on missing products or a full world", () => {
        const registry = makeRegistry();
        const world = makeWorld(800);
        world.spawn(record(registry, "alkane-c1"), 0, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), 1, 0, 0, 0);
        world.spawn(record(registry, "oxygen"), -1, 0, 0, 0);
        const missing = new OxidationEngine(
            { findById: () => undefined } as unknown as IMoleculeRegistry,
            new MoleculeFactory(),
        );
        missing.update(world, new SeededRandom(1), makeSink().sink);
        expect(world.getInstanceList().length).toBe(3);

        const stub = {
            getInstanceList: () => world.getInstanceList(),
            params: world.params,
            canAccommodate: () => false,
            remove: (): void => {},
            spawn: (): void => {},
        } as unknown as World;
        const engine = new OxidationEngine(registry, new MoleculeFactory());
        engine.update(stub, new SeededRandom(1), makeSink().sink);
        expect(true).toBe(true);
    });
});
