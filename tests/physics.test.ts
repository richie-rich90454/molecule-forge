import { describe, expect, it } from "vitest";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { MoleculeInstance } from "../src/sim/MoleculeInstance";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { SeededRandom } from "../src/sim/SeededRandom";
import { World } from "../src/sim/World";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";

function makeWorld(): World {
    const params = SimParamsFactory.createDefault();
    const engine = new PhysicsEngine(
        [
            new LennardJonesCalculator(2.2, 3),
            new CoulombCalculator(60, 20),
            new HydrogenBondCalculator(3, 3.5),
        ],
        params,
    );
    return new World(engine, 7);
}

function methaneRecord(): ReturnType<MoleculeFactory["build"]> {
    const factory = new MoleculeFactory();
    const spec = MoleculeCatalog.buildCompactSpecs().find((item) => item.id === "alkane-c1");
    if (spec === undefined) {
        throw new Error("methane spec missing");
    }
    return factory.build(spec);
}

describe("PhysicsEngine", () => {
    it("moves a body along its velocity", () => {
        const world = makeWorld();
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        inst.vx = 10;
        inst.vy = 0;
        inst.vz = 0;
        world.step(1 / 240, new SeededRandom(3));
        expect(inst.px).toBeGreaterThan(0);
    });

    it("pulls two close bodies together with van der Waals attraction", () => {
        const world = makeWorld();
        world.params.temperature = 0;
        world.params.viscosity = 0;
        const record = methaneRecord();
        const a = world.spawn(record, -2.2, 0, 0, 0);
        const b = world.spawn(record, 2.2, 0, 0, 0);
        a.vx = 0;
        b.vx = 0;
        const before = Math.abs(a.px - b.px);
        const rng = new SeededRandom(5);
        for (let i = 0; i < 120; i++) {
            world.step(1 / 240, rng);
        }
        const after = Math.abs(a.px - b.px);
        expect(after).toBeLessThan(before);
    });

    it("applies drag to slow fast bodies", () => {
        const world = makeWorld();
        world.params.viscosity = 1;
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        inst.vx = 50;
        const rng = new SeededRandom(9);
        for (let i = 0; i < 240; i++) {
            world.step(1 / 240, rng);
        }
        expect(Math.abs(inst.vx)).toBeLessThan(50);
    });

    it("keeps bodies inside the chamber", () => {
        const world = makeWorld();
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        inst.vx = 500;
        const rng = new SeededRandom(11);
        for (let i = 0; i < 240; i++) {
            world.step(1 / 240, rng);
        }
        expect(Math.abs(inst.px)).toBeLessThanOrEqual(world.boxSize * 0.5 + 1e-6);
    });

    it("constructs instances with positive radius and mass", () => {
        const record = methaneRecord();
        const inst = new MoleculeInstance(record, 0, 0, 0, 0, 0, 0, 1);
        expect(inst.radius).toBeGreaterThan(0);
        expect(inst.mass).toBeGreaterThan(0);
        expect(inst.alive).toBe(true);
    });
});
