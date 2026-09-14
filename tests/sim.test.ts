import { describe, expect, it } from "vitest";
import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { MoleculeInstance } from "../src/sim/MoleculeInstance";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { ReactionCatalog } from "../src/sim/ReactionCatalog";
import { ReactionEngine, type IReactionEvent } from "../src/sim/ReactionEngine";
import type { IReactionRule } from "../src/sim/ReactionCatalog";
import { SeededRandom } from "../src/sim/SeededRandom";
import { SimulationWorker } from "../src/sim/SimulationWorker";
import { World } from "../src/sim/World";
import { PresetCatalog } from "../src/presets/PresetCatalog";
import type { ICompactMoleculeSpec } from "../src/chem/MoleculeRecord";

function needSpec(id: string): ICompactMoleculeSpec {
    const spec = MoleculeCatalog.buildCompactSpecs().find((item) => item.id === id);
    if (spec === undefined) {
        throw new Error("spec missing: " + id);
    }
    return spec;
}

function methaneRecord(): ReturnType<MoleculeFactory["build"]> {
    return new MoleculeFactory().build(needSpec("alkane-c1"));
}

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

describe("SeededRandom", () => {
    it("produces values in range and reseeds from zero", () => {
        const rng = new SeededRandom(0);
        for (let i = 0; i < 10; i++) {
            const value = rng.next();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
        expect(rng.range(5, 10)).toBeGreaterThanOrEqual(5);
        expect(rng.integer(1, 3)).toBeGreaterThanOrEqual(1);
        expect(rng.integer(1, 3)).toBeLessThanOrEqual(3);
        expect(rng.pick(["a", "b", "c"]).length).toBe(1);
        const fork = rng.fork();
        expect(fork.next()).toBeGreaterThanOrEqual(0);
        expect(rng.getSeed()).not.toBe(0);
    });

    it("reproduces sequences from the same seed", () => {
        const a = new SeededRandom(99);
        const b = new SeededRandom(99);
        expect(a.next()).toBe(b.next());
        expect(a.next()).toBe(b.next());
    });
});

describe("ForceCalculators", () => {
    it("names each calculator", () => {
        expect(new LennardJonesCalculator(1, 3).getName()).toBe("LennardJones");
        expect(new CoulombCalculator(1, 10).getName()).toBe("Coulomb");
        expect(new HydrogenBondCalculator(1, 4).getName()).toBe("HydrogenBond");
    });

    it("handles degenerate Lennard-Jones inputs", () => {
        const calc = new LennardJonesCalculator(2.2, 3);
        const params = SimParamsFactory.createDefault();
        const base = {
            ax: 0,
            ay: 0,
            az: 0,
            bx: 1,
            by: 0,
            bz: 0,
            dist: 1,
            aRadius: 0,
            bRadius: 1,
            aCharge: 0,
            bCharge: 0,
            aDonors: 0,
            aAcceptors: 0,
            bDonors: 0,
            bAcceptors: 0,
            params,
        };
        expect(calc.computeMagnitude({ ...base, aRadius: 0, bRadius: 0 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 0 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 100, aRadius: 2, bRadius: 2 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 1.5, aRadius: 1, bRadius: 1 })).toBeLessThan(
            0,
        );
    });

    it("handles degenerate Coulomb inputs", () => {
        const calc = new CoulombCalculator(60, 20);
        const params = SimParamsFactory.createDefault();
        const base = {
            ax: 0,
            ay: 0,
            az: 0,
            bx: 2,
            by: 0,
            bz: 0,
            dist: 2,
            aRadius: 1,
            bRadius: 1,
            aCharge: 0,
            bCharge: 1,
            aDonors: 0,
            aAcceptors: 0,
            bDonors: 0,
            bAcceptors: 0,
            params,
        };
        expect(calc.computeMagnitude(base)).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 0, aCharge: 1 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 100, aCharge: 1 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, aCharge: 1 })).toBeGreaterThan(0);
        expect(calc.computeMagnitude({ ...base, aCharge: -1 })).toBeLessThan(0);
    });

    it("handles degenerate hydrogen bond inputs", () => {
        const calc = new HydrogenBondCalculator(3, 3.5);
        const params = SimParamsFactory.createDefault();
        const base = {
            ax: 0,
            ay: 0,
            az: 0,
            bx: 2,
            by: 0,
            bz: 0,
            dist: 2,
            aRadius: 1,
            bRadius: 1,
            aCharge: 0,
            bCharge: 0,
            aDonors: 1,
            aAcceptors: 0,
            bDonors: 0,
            bAcceptors: 1,
            params,
        };
        expect(calc.computeMagnitude(base)).toBeLessThan(0);
        expect(calc.computeMagnitude({ ...base, aDonors: 0 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, bAcceptors: 0 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 0 })).toBe(0);
        expect(calc.computeMagnitude({ ...base, dist: 9 })).toBe(0);
    });

    it("reports each force range for pair culling", () => {
        const body = (radius: number, charge: number, donors: number, acceptors: number) => ({
            radius,
            charge,
            donors,
            acceptors,
        });
        const lennardJones = new LennardJonesCalculator(2.2, 3);
        expect(lennardJones.getRange(body(1, 0, 0, 0), body(1, 0, 0, 0))).toBeCloseTo(3);
        const coulomb = new CoulombCalculator(60, 20);
        expect(coulomb.getRange(body(1, 1, 0, 0), body(1, -1, 0, 0))).toBe(20);
        expect(coulomb.getRange(body(1, 1, 0, 0), body(1, 0, 0, 0))).toBe(0);
        expect(coulomb.getRange(body(1, 0, 0, 0), body(1, 0, 0, 0))).toBe(0);
        const hydrogenBond = new HydrogenBondCalculator(3, 3.5);
        expect(hydrogenBond.getRange(body(1, 0, 1, 0), body(1, 0, 0, 1))).toBe(3.5);
        expect(hydrogenBond.getRange(body(1, 0, 1, 0), body(1, 0, 0, 0))).toBe(0);
        expect(hydrogenBond.getRange(body(1, 0, 0, 0), body(1, 0, 0, 0))).toBe(0);
    });
});

describe("MoleculeInstanceExtras", () => {
    it("exposes donors and snapshots state", () => {
        const factory = new MoleculeFactory();
        const spec = MoleculeCatalog.buildCompactSpecs().find((item) => item.id === "glycine");
        if (spec === undefined) {
            throw new Error("missing glycine");
        }
        const record = factory.build(spec);
        const inst = new MoleculeInstance(record, 1, 2, 3, 0, 0, 0, 5);
        expect(inst.getDonors()).toBeGreaterThan(0);
        expect(inst.getAcceptors()).toBeGreaterThan(0);
        inst.px = 9;
        inst.snapshotPrevious();
        expect(inst.prevPx).toBe(9);
    });
});

describe("PhysicsEngineExtras", () => {
    it("clamps runaway forces and speeds", () => {
        const world = makeWorld();
        world.params.temperature = 0;
        world.params.viscosity = 0;
        const record = methaneRecord();
        const a = world.spawn(record, 0, 0, 0, 0);
        const b = world.spawn(record, 0.3, 0, 0, 0);
        a.vx = 0;
        b.vx = 0;
        const rng = new SeededRandom(2);
        for (let i = 0; i < 30; i++) {
            world.step(1 / 240, rng);
        }
        expect(Number.isFinite(a.px)).toBe(true);
        expect(Number.isFinite(b.px)).toBe(true);
        expect(Math.abs(a.vx)).toBeLessThanOrEqual(120.01);
    });

    it("recovers non-finite bodies", () => {
        const world = makeWorld();
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        inst.px = Number.NaN;
        inst.qw = Number.NaN;
        world.step(1 / 240, new SeededRandom(3));
        expect(Number.isFinite(inst.px)).toBe(true);
        expect(inst.qw).toBeCloseTo(1, 5);
    });

    it("bounces off every wall", () => {
        const world = makeWorld();
        world.params.temperature = 0;
        world.params.viscosity = 0;
        const record = methaneRecord();
        const px = world.spawn(record, 29.9, 0, 0, 0);
        px.vx = 50;
        const nx = world.spawn(record, -29.9, 0, 0, 0);
        nx.vx = -50;
        const py = world.spawn(record, 0, 29.9, 0, 0);
        py.vy = 50;
        const ny = world.spawn(record, 0, -29.9, 0, 0);
        ny.vy = -50;
        const pz = world.spawn(record, 0, 0, 29.9, 0);
        pz.vz = 50;
        const nz = world.spawn(record, 0, 0, -29.9, 0);
        nz.vz = -50;
        const rng = new SeededRandom(4);
        for (let i = 0; i < 60; i++) {
            world.step(1 / 240, rng);
        }
        for (const inst of [px, nx, py, ny, pz, nz]) {
            expect(Math.abs(inst.px)).toBeLessThanOrEqual(30.01);
            expect(Math.abs(inst.py)).toBeLessThanOrEqual(30.01);
            expect(Math.abs(inst.pz)).toBeLessThanOrEqual(30.01);
        }
    });

    it("skips dead instances", () => {
        const world = makeWorld();
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        inst.alive = false;
        expect(() => world.step(1 / 240, new SeededRandom(6))).not.toThrow();
        expect(world.countAlive()).toBe(0);
    });

    it("integrates quaternions toward unit length", () => {
        const inst = new MoleculeInstance(methaneRecord(), 0, 0, 0, 0, 0, 0, 1);
        inst.avx = 5;
        inst.avy = -3;
        inst.avz = 2;
        PhysicsEngine.integrateQuaternion(inst, 1 / 240);
        const norm = Math.sqrt(
            inst.qw * inst.qw + inst.qx * inst.qx + inst.qy * inst.qy + inst.qz * inst.qz,
        );
        expect(norm).toBeCloseTo(1, 5);
    });
});

describe("WorldExtras", () => {
    it("notifies observers", () => {
        const world = makeWorld();
        const seen: string[] = [];
        world.addObserver({
            onSpawn: (inst) => seen.push("spawn" + inst.id),
            onRemove: (id) => seen.push("remove" + id),
            onClear: () => seen.push("clear"),
        });
        const record = methaneRecord();
        const inst = world.spawn(record, 0, 0, 0, 0);
        world.remove(inst.id);
        world.remove(99999);
        world.spawn(record, 0, 0, 0, 0);
        world.clear();
        expect(seen).toContain("clear");
        expect(seen.some((entry) => entry.startsWith("spawn"))).toBe(true);
        expect(seen.some((entry) => entry.startsWith("remove"))).toBe(true);
    });

    it("finds instances by category and limits results", () => {
        const world = makeWorld();
        const record = methaneRecord();
        world.spawn(record, 0, 0, 0, 0);
        world.spawn(record, 5, 0, 0, 0);
        expect(world.findInstances("", "alkanes", 10).length).toBe(2);
        expect(world.findInstances("", "pharma", 10).length).toBe(0);
        expect(world.findInstances("", "alkanes", 1).length).toBe(1);
        expect(world.findById(424242)).toBeUndefined();
    });

    it("indexes instances by molecule id and prunes empty buckets", () => {
        const world = makeWorld();
        expect(world.isEmpty()).toBe(true);
        const record = methaneRecord();
        const first = world.spawn(record, 0, 0, 0, 0);
        const second = world.spawn(record, 5, 0, 0, 0);
        expect(world.isEmpty()).toBe(false);
        expect(world.getInstanceCount()).toBe(2);
        expect(world.findInstances(record.id, null, 10).length).toBe(2);
        expect(world.findInstances("does-not-exist", null, 10).length).toBe(0);
        world.remove(first.id);
        expect(world.findInstances(record.id, null, 10).length).toBe(1);
        world.remove(second.id);
        expect(world.findInstances(record.id, null, 10).length).toBe(0);
        expect(world.findInstances("", record.category, 10).length).toBe(0);
        expect(world.isEmpty()).toBe(true);
    });

    it("tracks the atom budget", () => {
        const world = makeWorld();
        expect(world.getLiveAtoms()).toBe(0);
        expect(world.canAccommodate(10)).toBe(true);
        expect(world.canAccommodate(Number.MAX_SAFE_INTEGER)).toBe(false);
        const record = methaneRecord();
        world.spawn(record, 0, 0, 0, 0);
        expect(world.getLiveAtoms()).toBe(record.atoms.length);
    });

    it("moves the piston and decays transients", () => {
        const world = makeWorld();
        world.params.spark = 1;
        world.params.catalyst = 1;
        world.targetBoxSize = 30;
        const rng = new SeededRandom(8);
        for (let i = 0; i < 30; i++) {
            world.step(1 / 240, rng);
        }
        expect(world.boxSize).toBeLessThan(60);
        expect(world.params.spark).toBeLessThan(1);
        expect(world.params.catalyst).toBeLessThan(1);
        expect(world.time).toBeGreaterThan(0);
    });

    it("snapshots previous positions", () => {
        const world = makeWorld();
        const record = methaneRecord();
        const inst = world.spawn(record, 3, 0, 0, 0);
        inst.alive = false;
        world.snapshotPrevious();
        expect(inst.prevPx).toBe(3);
    });
});

describe("ReactionEngineExtras", () => {
    function customEngine(rules: IReactionRule[], find: (id: string) => unknown): ReactionEngine {
        return new ReactionEngine(rules, { findById: find } as never);
    }

    function methaneRule(overrides: Partial<IReactionRule>): IReactionRule {
        return {
            id: "custom",
            reactants: [{ category: null, tag: null, moleculeId: "alkane-c1", count: 1 }],
            products: [],
            conditions: {
                tempMin: null,
                tempMax: null,
                needsSpark: false,
                needsCatalyst: false,
                phMin: null,
                phMax: null,
            },
            activationEnergy: 0.001,
            deltaH: 0,
            visual: { flash: "#fff", particles: "puff" },
            rateLaw: "k",
            reference: "test",
            message: "custom",
            ...overrides,
        };
    }

    function hotMethaneWorld(): World {
        const world = makeWorld();
        world.params.temperature = 900;
        world.spawn(new MoleculeFactory().build(needSpec("alkane-c1")), 0, 0, 0, 0);
        return world;
    }

    it("rejects cold, hot-capped, and pH-gated rules", () => {
        const events: IReactionEvent[] = [];
        const sink = {
            publish: (event: IReactionEvent): void => {
                events.push(event);
            },
        };
        const rng = new SeededRandom(1);
        const hot = hotMethaneWorld();
        customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: 2000,
                        tempMax: null,
                        needsSpark: false,
                        needsCatalyst: false,
                        phMin: null,
                        phMax: null,
                    },
                }),
            ],
            () => undefined,
        ).update(hot, rng, sink);
        customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: null,
                        tempMax: 100,
                        needsSpark: false,
                        needsCatalyst: false,
                        phMin: null,
                        phMax: null,
                    },
                }),
            ],
            () => undefined,
        ).update(hot, rng, sink);
        customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: null,
                        tempMax: null,
                        needsSpark: false,
                        needsCatalyst: false,
                        phMin: 8,
                        phMax: null,
                    },
                }),
            ],
            () => undefined,
        ).update(hot, rng, sink);
        customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: null,
                        tempMax: null,
                        needsSpark: false,
                        needsCatalyst: false,
                        phMin: null,
                        phMax: 6,
                    },
                }),
            ],
            () => undefined,
        ).update(hot, rng, sink);
        customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: null,
                        tempMax: null,
                        needsSpark: false,
                        needsCatalyst: true,
                        phMin: null,
                        phMax: null,
                    },
                }),
            ],
            () => undefined,
        ).update(hot, rng, sink);
        expect(events.length).toBe(0);
    });

    it("fires spark rules on heat alone above 600 K", () => {
        const world = hotMethaneWorld();
        const events: IReactionEvent[] = [];
        const engine = customEngine(
            [
                methaneRule({
                    conditions: {
                        tempMin: null,
                        tempMax: null,
                        needsSpark: true,
                        needsCatalyst: false,
                        phMin: null,
                        phMax: null,
                    },
                }),
            ],
            () => undefined,
        );
        const sink = {
            publish: (event: IReactionEvent): void => {
                events.push(event);
            },
        };
        const rng = new SeededRandom(1);
        for (let i = 0; i < 10 && events.length === 0; i++) {
            world.spawn(new MoleculeFactory().build(needSpec("alkane-c1")), 0, 0, 0, 0);
            engine.update(world, rng, sink);
        }
        expect(events.length).toBe(1);
    });

    it("skips unknown product ids in custom rules", () => {
        const world = makeWorld();
        const factory = new MoleculeFactory();
        const specs = MoleculeCatalog.buildCompactSpecs();
        const methane = factory.build(specs.find((s) => s.id === "alkane-c1") as never);
        world.spawn(methane, 0, 0, 0, 0);
        const events: IReactionEvent[] = [];
        const engine = new ReactionEngine(
            [
                {
                    id: "custom-bad",
                    reactants: [{ category: null, tag: null, moleculeId: "alkane-c1", count: 1 }],
                    products: [{ moleculeId: "no-such-molecule", count: 1 }],
                    conditions: {
                        tempMin: null,
                        tempMax: null,
                        needsSpark: false,
                        needsCatalyst: false,
                        phMin: null,
                        phMax: null,
                    },
                    activationEnergy: 0.001,
                    deltaH: 0,
                    visual: { flash: "#fff", particles: "puff" },
                    rateLaw: "k",
                    reference: "test",
                    message: "custom",
                },
            ],
            { findById: () => undefined } as never,
        );
        engine.update(world, new SeededRandom(1), { publish: (event) => events.push(event) });
        expect(events.length).toBe(1);
        expect(world.countAlive()).toBe(0);
    });

    it("requires partners within radius", () => {
        const world = makeWorld();
        const factory = new MoleculeFactory();
        const specs = MoleculeCatalog.buildCompactSpecs();
        const methane = factory.build(specs.find((s) => s.id === "alkane-c1") as never);
        const oxygen = factory.build(specs.find((s) => s.id === "oxygen") as never);
        world.params.temperature = 900;
        world.spawn(methane, 0, 0, 0, 0);
        world.spawn(oxygen, 40, 0, 0, 0);
        world.spawn(oxygen, -40, 0, 0, 0);
        const events: IReactionEvent[] = [];
        const engine = new ReactionEngine(ReactionCatalog.buildRules(), {
            findById: (id: string) => {
                if (id === "alkane-c1") return methane;
                if (id === "oxygen") return oxygen;
                if (id === "carbon-dioxide") return methane;
                if (id === "water") return methane;
                return undefined;
            },
        } as never);
        engine.update(world, new SeededRandom(4), { publish: (event) => events.push(event) });
        expect(events.length).toBe(0);
    });

    it("enforces multi-count primaries", () => {
        const world = makeWorld();
        const factory = new MoleculeFactory();
        const specs = MoleculeCatalog.buildCompactSpecs();
        const benzene = factory.build(specs.find((s) => s.id === "benzene") as never);
        world.params.temperature = 900;
        world.spawn(benzene, 0, 0, 0, 0);
        const events: IReactionEvent[] = [];
        const engine = new ReactionEngine(ReactionCatalog.buildRules(), {
            findById: () => undefined,
        } as never);
        engine.update(world, new SeededRandom(4), { publish: (event) => events.push(event) });
        expect(events.length).toBe(0);
    });
});

describe("SimulationWorkerFallback", () => {
    it("reports availability and disposes cleanly", () => {
        const worker = new SimulationWorker();
        expect(typeof worker.available).toBe("boolean");
        worker.dispose();
        worker.dispose();
    });

    it("rejects force queries without a worker", async () => {
        const worker = new SimulationWorker();
        if (worker.available) {
            worker.dispose();
            return;
        }
        await expect(
            worker.computeForces(
                new Float64Array(3),
                new Float64Array(1),
                new Float64Array(1),
                1,
                1,
                1,
                1,
            ),
        ).rejects.toThrow();
        worker.dispose();
    });

    it("computes forces through a stubbed worker", async () => {
        const RealWorker = (globalThis as { Worker?: unknown }).Worker;
        class StubWorker {
            public onmessage: ((event: { data: unknown }) => void) | null = null;
            public constructor(_url: string) {
                void _url;
            }
            public postMessage(data: {
                requestId: number;
                positions: Float64Array;
                radii: Float64Array;
                charges: Float64Array;
                count: number;
                epsilon: number;
                dielectric: number;
                cutoff: number;
            }): void {
                const forces = new Float64Array(data.count * 3);
                const self = this;
                queueMicrotask(() => {
                    if (self.onmessage !== null) {
                        self.onmessage({ data: { requestId: data.requestId, forces } });
                    }
                });
            }
            public terminate(): void {}
        }
        (globalThis as { Worker?: unknown }).Worker = StubWorker;
        try {
            const worker = new SimulationWorker();
            expect(worker.available).toBe(true);
            const forces = await worker.computeForces(
                new Float64Array([0, 0, 0, 5, 0, 0]),
                new Float64Array([1, 1]),
                new Float64Array([0, 0]),
                2,
                2.2,
                20,
                10,
            );
            expect(forces.length).toBe(6);
            worker.dispose();
        } finally {
            if (RealWorker === undefined) {
                delete (globalThis as { Worker?: unknown }).Worker;
            } else {
                (globalThis as { Worker?: unknown }).Worker = RealWorker;
            }
        }
    });
});

describe("PresetCatalogConditions", () => {
    it("applies every condition field", () => {
        const params = SimParamsFactory.createDefault();
        PresetCatalog.applyConditions(params, {
            temperature: 500,
            pressure: 2,
            ph: 3,
            viscosity: 0.9,
            polarity: 0.1,
            gravity: 1,
            catalyst: 0.5,
        });
        expect(params.temperature).toBe(500);
        expect(params.pressure).toBe(2);
        expect(params.ph).toBe(3);
        expect(params.viscosity).toBe(0.9);
        expect(params.polarity).toBe(0.1);
        expect(params.gravity).toBe(1);
        expect(params.catalyst).toBe(0.5);
        const before = { ...params };
        PresetCatalog.applyConditions(params, {});
        expect(params).toEqual(before);
    });
});

describe("PhysicsEngine force field backend", () => {
    function makeEngineWorld(): { engine: PhysicsEngine; world: World } {
        const engine = new PhysicsEngine(
            [
                new LennardJonesCalculator(2.2, 3),
                new CoulombCalculator(60, 20),
                new HydrogenBondCalculator(3, 3.5),
            ],
            SimParamsFactory.createDefault(),
        );
        return { engine, world: new World(engine, 7) };
    }

    it("delegates forces to the backend and applies them", () => {
        const { engine, world } = makeEngineWorld();
        const inputs: Array<{ positions: Float64Array; outForces: Float64Array }> = [];
        engine.setForceField({
            compute: (input) => {
                inputs.push({ positions: input.positions, outForces: input.outForces });
                input.outForces.fill(1);
            },
        });
        const instance = world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.step(1 / 240, new SeededRandom(1));
        expect(inputs.length).toBe(1);
        expect(inputs[0].positions.length).toBe(3);

        const before = instance.vx;
        world.step(1 / 240, new SeededRandom(2));
        expect(inputs.length).toBe(2);
        expect(instance.vx).not.toBe(before);
    });

    it("skips dead instances and empty chambers", () => {
        const { engine, world } = makeEngineWorld();
        let calls = 0;
        engine.setForceField({
            compute: (input) => {
                calls++;
                input.outForces.fill(0);
            },
        });
        world.step(1 / 240, new SeededRandom(1));
        expect(calls).toBe(0);

        const alive = world.spawn(methaneRecord(), 0, 0, 0, 0);
        const dead = world.spawn(methaneRecord(), 2, 0, 0, 0);
        dead.alive = false;
        world.step(1 / 240, new SeededRandom(2));
        expect(calls).toBe(1);
        expect(alive.vx).toBeDefined();
    });

    it("switches back to the internal engine when cleared", () => {
        const { engine, world } = makeEngineWorld();
        let calls = 0;
        engine.setForceField({
            compute: () => {
                calls++;
            },
        });
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 0.8, 0, 0, 0);
        world.step(1 / 240, new SeededRandom(3));
        expect(calls).toBe(1);
        engine.setForceField(null);
        expect(() => world.step(1 / 240, new SeededRandom(4))).not.toThrow();
        expect(calls).toBe(1);
    });
});
