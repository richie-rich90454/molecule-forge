import { beforeAll, describe, expect, it } from "vitest";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { ReactionCatalog } from "../src/sim/ReactionCatalog";
import { ReactionEngine, type IReactionEvent } from "../src/sim/ReactionEngine";
import { SeededRandom } from "../src/sim/SeededRandom";
import { World } from "../src/sim/World";

let registry: MoleculeRegistry;

beforeAll(() => {
    registry = new MoleculeRegistry(new MoleculeFactory());
}, 120000);

function makeWorld(): World {
    const params = SimParamsFactory.createDefault();
    const physics = new PhysicsEngine(
        [
            new LennardJonesCalculator(2.2, 3),
            new CoulombCalculator(60, 20),
            new HydrogenBondCalculator(3, 3.5),
        ],
        params,
    );
    return new World(physics, 21);
}

function makeEngine(): ReactionEngine {
    return new ReactionEngine(ReactionCatalog.buildRules(), registry);
}

class CollectingSink {
    public events: IReactionEvent[] = [];

    public publish(event: IReactionEvent): void {
        this.events.push(event);
    }
}

describe("ReactionEngine", () => {
    it("burns methane with oxygen when hot", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        const methane = registry.findById("alkane-c1");
        const oxygen = registry.findById("oxygen");
        if (methane === undefined || oxygen === undefined) {
            throw new Error("missing records");
        }
        world.spawn(methane, 0, 0, 0, 0);
        world.spawn(oxygen, 1, 0, 0, 0);
        world.spawn(oxygen, -1, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(4);
        for (let i = 0; i < 200 && sink.events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events.length).toBeGreaterThan(0);
        expect(sink.events[0].ruleId).toBe("combustion-methane");
    });

    it("does not burn methane when cold", () => {
        const world = makeWorld();
        world.params.temperature = 100;
        const methane = registry.findById("alkane-c1");
        const oxygen = registry.findById("oxygen");
        if (methane === undefined || oxygen === undefined) {
            throw new Error("missing records");
        }
        world.spawn(methane, 0, 0, 0, 0);
        world.spawn(oxygen, 1, 0, 0, 0);
        world.spawn(oxygen, -1, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(4);
        for (let i = 0; i < 20; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events.length).toBe(0);
    });

    it("ships at least twelve reaction rules", () => {
        expect(ReactionCatalog.buildRules().length).toBeGreaterThanOrEqual(12);
    });

    it("conserves atoms in every reaction rule", () => {
        for (const rule of ReactionCatalog.buildRules()) {
            if (rule.products.length === 0) {
                continue;
            }
            const left: Record<string, number> = {};
            const right: Record<string, number> = {};
            for (const reactant of rule.reactants) {
                const record = registry.findById(reactant.moleculeId);
                if (record === undefined) {
                    throw new Error("missing reactant " + reactant.moleculeId);
                }
                for (const atom of record.atoms) {
                    left[atom.el] = (left[atom.el] ?? 0) + reactant.count;
                }
            }
            for (const product of rule.products) {
                const record = registry.findById(product.moleculeId);
                if (record === undefined) {
                    throw new Error("missing product " + product.moleculeId);
                }
                for (const atom of record.atoms) {
                    right[atom.el] = (right[atom.el] ?? 0) + product.count;
                }
            }
            expect(right).toEqual(left);
        }
    });

    it("hydrolyzes ATP into ADP", () => {
        const world = makeWorld();
        const atp = registry.findById("atp");
        const water = registry.findById("water");
        if (atp === undefined || water === undefined) {
            throw new Error("missing ATP");
        }
        world.spawn(atp, 0, 0, 0, 0);
        world.spawn(water, 1, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(8);
        for (let i = 0; i < 1500 && sink.events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events.length).toBeGreaterThan(0);
    });

    it("stages crystallization and folding without consuming matter", () => {
        const crystallization = makeWorld();
        crystallization.params.temperature = 260;
        const nacl = registry.findById("sodium-chloride");
        const brine = registry.findById("water");
        if (nacl === undefined || brine === undefined) {
            throw new Error("missing salt or water");
        }
        crystallization.spawn(nacl, 0, 0, 0, 0);
        crystallization.spawn(nacl, 1, 0, 0, 0);
        crystallization.spawn(brine, 0, 1, 0, 0);
        crystallization.spawn(brine, 1, 1, 0, 0);
        const crystalSink = new CollectingSink();
        const crystalEngine = makeEngine();
        const crystalRng = new SeededRandom(3);
        for (let i = 0; i < 600 && crystalSink.events.length === 0; i++) {
            crystalEngine.update(crystallization, crystalRng, crystalSink);
        }
        expect(crystalSink.events[0].ruleId).toBe("crystallization");
        expect(crystallization.getInstanceList().length).toBe(4);
        const afterFirst = crystalSink.events.length;
        for (let i = 0; i < 5; i++) {
            crystalEngine.update(crystallization, crystalRng, crystalSink);
        }
        expect(crystalSink.events.length).toBe(afterFirst);

        const folding = makeWorld();
        folding.params.temperature = 300;
        const insulin = registry.findById("insulin");
        if (insulin === undefined) {
            throw new Error("missing insulin");
        }
        folding.spawn(insulin, 0, 0, 0, 0);
        const foldSink = new CollectingSink();
        const foldEngine = makeEngine();
        const foldRng = new SeededRandom(11);
        for (let i = 0; i < 600 && foldSink.events.length === 0; i++) {
            foldEngine.update(folding, foldRng, foldSink);
        }
        expect(foldSink.events[0].ruleId).toBe("protein-folding");
        expect(folding.getInstanceList().length).toBe(1);
    });

    it("detonates TNT into balanced products", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        const tnt = registry.findById("tnt");
        if (tnt === undefined) {
            throw new Error("missing TNT");
        }
        world.spawn(tnt, 0, 0, 0, 0);
        world.spawn(tnt, 0.5, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(5);
        for (let i = 0; i < 400 && sink.events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events[0].ruleId).toBe("detonation-tnt");
        const totals: Record<string, number> = {};
        for (const inst of world.getInstanceList()) {
            for (const atom of inst.record.atoms) {
                totals[atom.el] = (totals[atom.el] ?? 0) + 1;
            }
        }
        expect(totals).toEqual({ C: 14, H: 10, N: 6, O: 12 });
    });

    it("detonates spread-out charges once the spark is armed", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        world.params.spark = 1;
        const tnt = registry.findById("tnt");
        if (tnt === undefined) {
            throw new Error("missing TNT");
        }
        world.spawn(tnt, 0, 0, 0, 0);
        world.spawn(tnt, 40, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(5);
        for (let i = 0; i < 400 && sink.events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events[0].ruleId).toBe("detonation-tnt");
        expect(world.getInstanceList().some((inst) => inst.record.id === "nitrogen")).toBe(true);
    });
});
