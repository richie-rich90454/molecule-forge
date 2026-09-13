import { describe, expect, it } from "vitest";
import { ChamberAnalysis, LabRecorder } from "../src/sim/LabRecorder";
import type { IReactionEvent } from "../src/sim/ReactionEngine";
import type { World } from "../src/sim/World";

function stubWorld(instances: ReadonlyArray<unknown>): World {
    return { getInstanceList: () => instances } as unknown as World;
}

function stubInstance(
    id: string,
    name: string,
    formula: string,
    atoms: ReadonlyArray<{ el: string; charge: number }>,
    charge: number,
): unknown {
    return { record: { id, name, formula, atoms }, charge };
}

function sampleWorld(count: number): World {
    return {
        params: { temperature: 310, pressure: 1.2, ph: 6.5 },
        countAlive: () => count,
    } as unknown as World;
}

function event(ruleId: string, deltaH?: number): IReactionEvent {
    return {
        ruleId,
        message: "msg",
        x: 0,
        y: 0,
        z: 0,
        flash: "#fff",
        particles: "puff",
        deltaH,
    };
}

describe("LabRecorder", () => {
    it("samples the chamber on an interval", () => {
        const recorder = new LabRecorder();
        const world = sampleWorld(5);
        expect(recorder.getSamples().length).toBe(0);
        expect(recorder.sample(world, 0)).toBe(true);
        expect(recorder.sample(world, 0.1)).toBe(false);
        expect(recorder.sample(world, 0.6)).toBe(true);
        expect(recorder.getSamples().length).toBe(2);
        const latest = recorder.getSamples()[1];
        expect(latest.molecules).toBe(5);
        expect(latest.temperature).toBe(310);
        expect(latest.pressure).toBe(1.2);
        expect(latest.ph).toBe(6.5);
    });

    it("caps stored samples", () => {
        const recorder = new LabRecorder();
        const world = sampleWorld(1);
        for (let i = 0; i < 300; i++) {
            recorder.sample(world, i * 0.6);
        }
        expect(recorder.getSamples().length).toBe(240);
    });

    it("accumulates energy and prunes old events", () => {
        const recorder = new LabRecorder();
        recorder.noteEvent(event("a", -100), 1);
        recorder.noteEvent(event("a", undefined), 2);
        expect(recorder.getEnergy()).toBe(-100);
        recorder.noteEvent(event("b", -50), 20);
        expect(recorder.getEnergy()).toBe(-150);
        const rates = recorder.rateAt(20);
        expect(rates.length).toBe(1);
        expect(rates[0].ruleId).toBe("b");
        expect(rates[0].perSecond).toBeCloseTo(0.1, 5);
    });

    it("drops events outside the rate window and resets", () => {
        const recorder = new LabRecorder();
        recorder.noteEvent(event("a"), 0);
        recorder.noteEvent(event("b"), 1);
        const rates = recorder.rateAt(30);
        expect(rates.length).toBe(0);
        recorder.noteEvent(event("a", -10), 31);
        recorder.reset();
        expect(recorder.getEnergy()).toBe(0);
        expect(recorder.getSamples().length).toBe(0);
        expect(recorder.rateAt(31).length).toBe(0);
    });
});

describe("ChamberAnalysis", () => {
    it("groups composition by molecule and sorts by count", () => {
        const world = stubWorld([
            stubInstance("water", "Water", "H2O", [{ el: "H", charge: 0 }], 0),
            stubInstance("water", "Water", "H2O", [{ el: "H", charge: 0 }], 0),
            stubInstance("benzene", "Benzene", "C6H6", [{ el: "C", charge: 0 }], 0),
        ]);
        const composition = ChamberAnalysis.composition(world);
        expect(composition.length).toBe(2);
        expect(composition[0].id).toBe("water");
        expect(composition[0].count).toBe(2);
    });

    it("counts atoms and net charge", () => {
        const world = stubWorld([
            stubInstance(
                "salt",
                "Salt",
                "NaCl",
                [
                    { el: "Na", charge: 1 },
                    { el: "Cl", charge: -1 },
                ],
                0,
            ),
            stubInstance("proton", "Proton", "H+", [{ el: "H", charge: 1 }], 1),
        ]);
        const atoms = ChamberAnalysis.atomBalance(world);
        expect(atoms.find((entry) => entry.element === "Na")?.count).toBe(1);
        expect(ChamberAnalysis.netCharge(world)).toBe(1);
    });

    it("ranks cell potentials for elements present", () => {
        const world = stubWorld([
            stubInstance("magnesium", "Magnesium", "Mg", [{ el: "Mg", charge: 0 }], 0),
            stubInstance("zinc", "Zinc", "Zn", [{ el: "Zn", charge: 0 }], 0),
            stubInstance("copper", "Copper", "Cu", [{ el: "Cu", charge: 0 }], 0),
            stubInstance("methane", "Methane", "CH4", [{ el: "C", charge: 0 }], 0),
        ]);
        const potentials = ChamberAnalysis.cellPotentials(world);
        expect(potentials.length).toBeGreaterThan(0);
        expect(potentials[0].volts).toBeGreaterThan(0);
    });
});
