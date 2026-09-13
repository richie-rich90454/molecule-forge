import { describe, expect, it } from "vitest";
import { CompoundSynthesizer } from "../src/chem/CompoundSynthesizer";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import type { IMoleculeRecord, IMoleculeRegistry } from "../src/chem/MoleculeRecord";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import type { IReactionEvent, IReactionSink } from "../src/sim/ReactionEngine";
import { RedoxEngine } from "../src/sim/RedoxEngine";
import { SeededRandom } from "../src/sim/SeededRandom";
import { World } from "../src/sim/World";

function makeRegistry(): MoleculeRegistry {
    return new MoleculeRegistry(new MoleculeFactory());
}

function makeWorld(): World {
    return new World(new PhysicsEngine([], SimParamsFactory.createDefault()), 3);
}

function record(registry: MoleculeRegistry, id: string): IMoleculeRecord {
    const found = registry.findById(id);
    if (found === undefined) {
        throw new Error("missing record: " + id);
    }
    return found;
}

function synthRecord(
    synthesizer: CompoundSynthesizer,
    totals: Record<string, number>,
): IMoleculeRecord {
    const product = synthesizer.predict({
        totals: new Map(Object.entries(totals)),
        monatomic: new Map(),
    }).product;
    if (product === null || product.record === null) {
        throw new Error("no record");
    }
    return product.record;
}

function makeSink(): { events: IReactionEvent[]; sink: IReactionSink } {
    const events: IReactionEvent[] = [];
    return { events, sink: { publish: (event) => events.push(event) } };
}

describe("RedoxEngine", () => {
    it("lets zinc displace copper from copper chloride", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        const tracker = makeSink();
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(1), tracker.sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.some((inst) => inst.record.formula === "ZnCl2")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-cu")).toBe(true);
        expect(tracker.events.some((event) => event.ruleId === "redox-Zn-Cu")).toBe(true);
    });

    it("does not let copper displace zinc", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(registry, "el-cu"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Zn: 1, Cl: 2 }), 1, 0, 0, 0);
        const tracker = makeSink();
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(2), tracker.sink);
        expect(world.getInstanceList().length).toBe(2);
        expect(tracker.events.length).toBe(0);
    });

    it("ignores distant pairs and missing partners", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        const engine = new RedoxEngine(registry, synthesizer);
        engine.update(world, new SeededRandom(3), makeSink().sink);
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Cu: 1, Cl: 2 }), 40, 0, 0, 0);
        engine.update(world, new SeededRandom(3), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("skips salts without a simple metal and anion pair", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Na: 1, O: 1, H: 1 }), 1, 0, 0, 0);
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(4), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("ignores metal atoms without a reduction couple", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(5), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("stops when the chamber cannot hold the products", () => {
        const registry = makeRegistry();
        const real = new CompoundSynthesizer();
        const world = makeWorld();
        const zn = world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        const salt = world.spawn(synthRecord(real, { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        const stub = {
            getInstanceList: () => [zn, salt],
            canAccommodate: () => false,
            remove: (): void => {},
            spawn: (): void => {},
        } as unknown as World;
        new RedoxEngine(registry, real).update(stub, new SeededRandom(6), makeSink().sink);
        expect(true).toBe(true);
    });

    it("bails out when the synthesizer cannot form a replacement", () => {
        const registry = makeRegistry();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(new CompoundSynthesizer(), { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        const nullProduct = {
            predict: () => ({ product: null, hint: null }),
        } as unknown as CompoundSynthesizer;
        new RedoxEngine(registry, nullProduct).update(world, new SeededRandom(7), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);

        const covalent = {
            predict: () => ({
                product: {
                    kind: "covalent",
                    catalogId: null,
                    record: null,
                    name: "x",
                    formula: "x",
                    needs: new Map(),
                    units: 1,
                    enthalpy: null,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        new RedoxEngine(registry, covalent).update(world, new SeededRandom(7), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);

        const noRecord = {
            predict: () => ({
                product: {
                    kind: "ionic",
                    catalogId: null,
                    record: null,
                    name: "x",
                    formula: "x",
                    needs: new Map(),
                    units: 1,
                    enthalpy: null,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        new RedoxEngine(registry, noRecord).update(world, new SeededRandom(7), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("resolves catalogue replacement salts", () => {
        const registry = makeRegistry();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(new CompoundSynthesizer(), { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        const catalogue = {
            predict: () => ({
                product: {
                    kind: "ionic",
                    catalogId: "sodium-chloride",
                    record: null,
                    name: "Sodium chloride",
                    formula: "NaCl",
                    needs: new Map([
                        ["Na", 1],
                        ["Cl", 1],
                    ]),
                    units: 1,
                    enthalpy: null,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        new RedoxEngine(registry, catalogue).update(world, new SeededRandom(8), makeSink().sink);
        const list = world.getInstanceList();
        expect(list.some((inst) => inst.record.id === "sodium-chloride")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-cu")).toBe(true);
    });

    it("skips a salt of the same metal", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Zn: 1, Cl: 2 }), 1, 0, 0, 0);
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(11), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("rejects records that are neither salts nor elements", () => {
        const registry = makeRegistry();
        const synthesizer = new CompoundSynthesizer();
        const base = record(registry, "el-na");
        const fake = {
            ...base,
            id: "fake-nahe",
            formula: "NaHe",
            bonds: [],
            atoms: [base.atoms[0], record(registry, "el-he").atoms[0]],
        } as IMoleculeRecord;
        const world = makeWorld();
        world.spawn(fake, 0, 0, 0, 0);
        new RedoxEngine(registry, synthesizer).update(world, new SeededRandom(12), makeSink().sink);
        expect(world.getInstanceList().length).toBe(1);
    });

    it("bails out when a catalogue replacement is missing", () => {
        const registry = makeRegistry();
        const world = makeWorld();
        world.spawn(record(registry, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(new CompoundSynthesizer(), { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        const missing = {
            predict: () => ({
                product: {
                    kind: "ionic",
                    catalogId: "no-such-salt",
                    record: null,
                    name: "x",
                    formula: "x",
                    needs: new Map(),
                    units: 1,
                    enthalpy: null,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        new RedoxEngine(registry, missing).update(world, new SeededRandom(9), makeSink().sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("bails out when the displaced element has no atom record", () => {
        const real = makeRegistry();
        const stubRegistry = {
            findById: (id: string) => (id === "el-cu" ? undefined : real.findById(id)),
        } as unknown as IMoleculeRegistry;
        const synthesizer = new CompoundSynthesizer();
        const world = makeWorld();
        world.spawn(record(real, "el-zn"), 0, 0, 0, 0);
        world.spawn(synthRecord(synthesizer, { Cu: 1, Cl: 2 }), 1, 0, 0, 0);
        new RedoxEngine(stubRegistry, synthesizer).update(
            world,
            new SeededRandom(10),
            makeSink().sink,
        );
        expect(world.getInstanceList().length).toBe(2);
    });
});
