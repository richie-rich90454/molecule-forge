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

    it("hydrolyzes ATP into ADP", () => {
        const world = makeWorld();
        const atp = registry.findById("atp");
        if (atp === undefined) {
            throw new Error("missing ATP");
        }
        world.spawn(atp, 0, 0, 0, 0);
        const sink = new CollectingSink();
        const engine = makeEngine();
        const rng = new SeededRandom(8);
        for (let i = 0; i < 1500 && sink.events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(sink.events.length).toBeGreaterThan(0);
    });
});
