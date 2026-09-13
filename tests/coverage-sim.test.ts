import { describe, expect, it, vi } from "vitest";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import type { IAtomSpec, IMoleculeRecord, IMoleculeRegistry } from "../src/chem/MoleculeRecord";
import { CoulombCalculator } from "../src/sim/CoulombCalculator";
import { HydrogenBondCalculator } from "../src/sim/HydrogenBondCalculator";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { LennardJonesCalculator } from "../src/sim/LennardJonesCalculator";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import type { IReactionRule } from "../src/sim/ReactionCatalog";
import { ReactionEngine, type IReactionEvent } from "../src/sim/ReactionEngine";
import { SeededRandom } from "../src/sim/SeededRandom";
import { SimulationWorker } from "../src/sim/SimulationWorker";
import { SpatialHashGrid } from "../src/sim/SpatialHashGrid";
import { World } from "../src/sim/World";

function methaneRecord(): IMoleculeRecord {
    const spec = {
        id: "alkane-c1",
        name: "Methane",
        formula: "CH4",
        smiles: "C",
        category: "alkanes" as const,
        tags: ["gas", "fuel"],
        warn: false,
        inchi: "",
        heavy: ["C"],
        bonds: [] as Array<readonly [number, number, number]>,
        charges: [],
        explicitH: [],
    };
    return new MoleculeFactory().build(spec);
}

function makeWorld(seed: number = 7): World {
    const params = SimParamsFactory.createDefault();
    const engine = new PhysicsEngine(
        [
            new LennardJonesCalculator(2.2, 3),
            new CoulombCalculator(60, 20),
            new HydrogenBondCalculator(3, 3.5),
        ],
        params,
    );
    return new World(engine, seed);
}

function methaneRule(overrides: Partial<IReactionRule>): IReactionRule {
    return {
        id: "coverage",
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
        message: "coverage",
        ...overrides,
    };
}

function customEngine(
    rules: IReactionRule[],
    find: (id: string) => IMoleculeRecord | undefined = () => undefined,
): ReactionEngine {
    return new ReactionEngine(rules, { findById: find } as unknown as IMoleculeRegistry);
}

function collect(): {
    sink: { publish: (event: IReactionEvent) => void };
    events: IReactionEvent[];
} {
    const events: IReactionEvent[] = [];
    return {
        sink: {
            publish: (event: IReactionEvent): void => {
                events.push(event);
            },
        },
        events,
    };
}

describe("ReactionEngine coverage", () => {
    it("exposes its rule list", () => {
        const engine = customEngine([methaneRule({})]);
        expect(engine.getRules().length).toBe(1);
    });

    it("consumes a multi-count primary", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 1, 0, 0, 0);
        const { sink, events } = collect();
        const engine = customEngine([
            methaneRule({
                reactants: [{ category: null, tag: null, moleculeId: "alkane-c1", count: 2 }],
            }),
        ]);
        const rng = new SeededRandom(1);
        for (let i = 0; i < 10 && events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(events.length).toBe(1);
    });

    it("keeps collecting primary partners until the count is met", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        for (let i = 0; i < 3; i++) {
            world.spawn(methaneRecord(), i, 0, 0, 0);
        }
        const { sink, events } = collect();
        const engine = customEngine([
            methaneRule({
                reactants: [{ category: null, tag: null, moleculeId: "alkane-c1", count: 3 }],
            }),
        ]);
        const rng = new SeededRandom(9);
        for (let i = 0; i < 10 && events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(events.length).toBe(1);
    });

    it("skips a partner already consumed by another reactant", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        const { sink, events } = collect();
        const engine = customEngine([
            methaneRule({
                reactants: [
                    { category: null, tag: null, moleculeId: "alkane-c1", count: 1 },
                    { category: null, tag: null, moleculeId: "alkane-c1", count: 1 },
                ],
            }),
        ]);
        engine.update(world, new SeededRandom(2), sink);
        expect(events.length).toBe(0);
    });

    it("matches reactants by tag", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        const { sink, events } = collect();
        const engine = customEngine([
            methaneRule({ reactants: [{ category: null, tag: "fuel", moleculeId: "", count: 1 }] }),
        ]);
        const rng = new SeededRandom(3);
        for (let i = 0; i < 10 && events.length === 0; i++) {
            engine.update(world, rng, sink);
        }
        expect(events.length).toBe(1);
    });

    it("stops product spawning at the atom budget", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        const methane = methaneRecord();
        world.spawn(methane, 0, 0, 0, 0);
        const huge = {
            ...methane,
            atoms: { length: 300000 } as unknown as ReadonlyArray<IAtomSpec>,
        } as IMoleculeRecord;
        const { sink, events } = collect();
        const engine = customEngine(
            [methaneRule({ products: [{ moleculeId: "huge", count: 1 }] })],
            (id) => (id === "huge" ? huge : undefined),
        );
        engine.update(world, new SeededRandom(4), sink);
        expect(events.length).toBe(1);
        expect(world.countAlive()).toBe(0);
    });

    it("rejects a spark rule below the ignition temperature", () => {
        const world = makeWorld();
        world.params.temperature = 100;
        world.params.spark = 0;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        const { sink, events } = collect();
        const engine = customEngine([
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
        ]);
        engine.update(world, new SeededRandom(5), sink);
        expect(events.length).toBe(0);
    });

    it("gives up when the second primary partner is out of range", () => {
        const world = makeWorld();
        world.params.temperature = 900;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 100, 0, 0, 0);
        const { sink, events } = collect();
        const engine = customEngine([
            methaneRule({
                reactants: [{ category: null, tag: null, moleculeId: "alkane-c1", count: 2 }],
            }),
        ]);
        engine.update(world, new SeededRandom(6), sink);
        expect(events.length).toBe(0);
    });
});

describe("PhysicsEngine coverage", () => {
    it("skips pairs whose lookup vanishes from the world", () => {
        const world = makeWorld();
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 0.4, 0, 0, 0);
        const spy = vi.spyOn(world, "findById").mockReturnValue(undefined);
        try {
            expect(() => world.step(1 / 240, new SeededRandom(1))).not.toThrow();
        } finally {
            spy.mockRestore();
        }
    });

    it("skips perfectly overlapping bodies", () => {
        const world = makeWorld();
        world.params.temperature = 0;
        world.params.viscosity = 0;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.step(1 / 240, new SeededRandom(1));
        expect(world.countAlive()).toBe(2);
    });

    it("clamps strongly attractive pair forces", () => {
        const attractive = {
            getName: (): string => "attractive",
            computeMagnitude: (): number => -10000,
        };
        const engine = new PhysicsEngine([attractive], SimParamsFactory.createDefault());
        const world = new World(engine, 5);
        world.params.temperature = 0;
        world.spawn(methaneRecord(), 0, 0, 0, 0);
        world.spawn(methaneRecord(), 0.3, 0, 0, 0);
        world.step(1 / 240, new SeededRandom(1));
        expect(world.countAlive()).toBe(2);
    });
});

describe("SpatialHashGrid coverage", () => {
    it("skips entries with no recorded position", () => {
        const grid = new SpatialHashGrid(6);
        grid.insert(1, 0, 0, 0);
        (grid as unknown as { positions: Map<number, number[]> }).positions.delete(1);
        const out: number[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
    });

    it("rejects a same-cell entry outside the radius", () => {
        const grid = new SpatialHashGrid(6);
        grid.insert(1, 11, 0, 0);
        const out: number[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
    });
});

describe("World coverage", () => {
    it("skips dead instances when searching", () => {
        const world = makeWorld();
        const inst = world.spawn(methaneRecord(), 0, 0, 0, 0);
        inst.alive = false;
        expect(world.findInstances("", null, 10).length).toBe(0);
    });

    it("snapshots living instances", () => {
        const world = makeWorld();
        const inst = world.spawn(methaneRecord(), 4, 0, 0, 0);
        inst.px = 9;
        world.snapshotPrevious();
        expect(inst.prevPx).toBe(9);
    });
});

describe("SimulationWorker coverage", () => {
    it("ignores responses for unknown requests", () => {
        const RealWorker = (globalThis as { Worker?: unknown }).Worker;
        class StubWorker {
            public onmessage: ((event: { data: unknown }) => void) | null = null;
            public constructor(_url: string) {
                void _url;
            }
            public postMessage(_data: unknown): void {}
            public terminate(): void {}
        }
        (globalThis as { Worker?: unknown }).Worker = StubWorker;
        try {
            const worker = new SimulationWorker();
            const inner = (
                worker as unknown as {
                    worker: {
                        onmessage: (event: {
                            data: { requestId: number; forces: Float64Array };
                        }) => void;
                    } | null;
                }
            ).worker;
            expect(inner).not.toBeNull();
            inner?.onmessage({ data: { requestId: 424242, forces: new Float64Array(0) } });
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
