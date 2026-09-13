import { describe, expect, it } from "vitest";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import type { IMoleculeRecord } from "../src/chem/MoleculeRecord";
import { DecompositionEngine } from "../src/sim/DecompositionEngine";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import type { IReactionEvent, IReactionSink } from "../src/sim/ReactionEngine";
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

function totals(instances: ReadonlyArray<{ record: IMoleculeRecord }>): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const inst of instances) {
        for (const atom of inst.record.atoms) {
            counts[atom.el] = (counts[atom.el] ?? 0) + 1;
        }
    }
    return counts;
}

describe("DecompositionEngine", () => {
    it("cracks octane into two fragments at high temperature", () => {
        const registry = makeRegistry();
        const engine = new DecompositionEngine(new MoleculeFactory());
        const world = makeWorld(1500);
        const octane = record(registry, "alkane-c8");
        world.spawn(octane, 0, 0, 0, 0);
        const before = totals([{ record: octane }]);
        const tracker = makeSink();
        engine.update(world, new SeededRandom(1), tracker.sink);
        expect(world.getInstanceList().length).toBe(2);
        expect(totals(world.getInstanceList())).toEqual(before);
        expect(tracker.events[0].ruleId).toBe("cracking-alkane-c8");
        expect(tracker.events[0].message).toContain("cracks into");
    });

    it("preserves formal charges in the fragments", () => {
        const registry = makeRegistry();
        const engine = new DecompositionEngine(new MoleculeFactory());
        const base = record(registry, "alkane-c8");
        const charged = {
            ...base,
            id: "charged-octane",
            atoms: base.atoms.map((atom, index) => (index === 0 ? { ...atom, charge: 1 } : atom)),
        } as IMoleculeRecord;
        const world = makeWorld(1500);
        world.spawn(charged, 0, 0, 0, 0);
        engine.update(world, new SeededRandom(1), makeSink().sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.some((inst) => inst.record.atoms.some((atom) => atom.charge === 1))).toBe(true);
        expect(totals(list)).toEqual(totals([{ record: charged }]));
    });

    it("leaves small, ring, inorganic, and cold molecules intact", () => {
        const registry = makeRegistry();
        const engine = new DecompositionEngine(new MoleculeFactory());
        const cases: Array<[string, number]> = [
            ["alkane-c1", 1500],
            ["benzene", 1500],
            ["sulfur-s8", 1500],
            ["alkane-c8", 300],
        ];
        for (const [id, temperature] of cases) {
            const world = makeWorld(temperature);
            world.spawn(record(registry, id), 0, 0, 0, 0);
            const tracker = makeSink();
            engine.update(world, new SeededRandom(1), tracker.sink);
            expect(world.getInstanceList().length).toBe(1);
            expect(tracker.events.length).toBe(0);
        }
    });
});
