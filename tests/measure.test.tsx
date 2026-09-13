import { render, fireEvent, screen, cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IMeasureData } from "../src/sim/LabRecorder";
import type { IReactionRule } from "../src/sim/ReactionCatalog";
import { MeasureView } from "../src/ui/MeasureView";

afterEach(() => {
    cleanup();
});

function rule(id: string, activationEnergy: number, deltaH: number): IReactionRule {
    return {
        id,
        reactants: [],
        products: [],
        conditions: {
            tempMin: null,
            tempMax: null,
            needsSpark: false,
            needsCatalyst: false,
            phMin: null,
            phMax: null,
        },
        activationEnergy,
        deltaH,
        visual: { flash: "#fff", particles: "puff" },
        rateLaw: "",
        reference: "",
        message: "",
    };
}

function makeData(overrides: Partial<IMeasureData>): IMeasureData {
    return {
        composition: [],
        atoms: [],
        netCharge: 0,
        samples: [],
        rates: [],
        rules: [],
        selectedRuleId: "",
        potentials: [],
        energy: 0,
        ...overrides,
    };
}

describe("MeasureView", () => {
    it("renders a populated chamber", () => {
        const onSelectRule = vi.fn();
        const data = makeData({
            composition: [
                { id: "water", name: "Water", formula: "H2O", count: 4 },
                { id: "benzene", name: "Benzene", formula: "C6H6", count: 1 },
            ],
            atoms: [
                { element: "H", count: 8 },
                { element: "O", count: 4 },
            ],
            netCharge: 2,
            samples: [
                { time: 0, temperature: 300, pressure: 1, ph: 7, molecules: 1, energy: 0 },
                { time: 1, temperature: 320, pressure: 1, ph: 7, molecules: 3, energy: -50 },
                { time: 2, temperature: 310, pressure: 1, ph: 7, molecules: 2, energy: -120 },
            ],
            rates: [{ ruleId: "combustion-methane", count: 3, perSecond: 0.3 }],
            rules: [rule("rule-a", 120, -200), rule("rule-b", 80, 60)],
            selectedRuleId: "rule-a",
            potentials: [{ oxidized: "Zn", reduced: "Cu", volts: 1.1 }],
            energy: -120,
        });
        const { unmount } = render(() => MeasureView({ data, onSelectRule }));
        expect(screen.getByText("Water")).toBeInTheDocument();
        expect(screen.getByText("-120 kJ released")).toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
        expect(screen.getByText("Combustion methane")).toBeInTheDocument();
        expect(screen.getByText("1.10 V")).toBeInTheDocument();
        const select = screen.getByRole("combobox") as HTMLSelectElement;
        fireEvent.change(select, { target: { value: "rule-b" } });
        expect(onSelectRule).toHaveBeenCalledWith("rule-b");
        unmount();
    });

    it("renders empty fallbacks", () => {
        const data = makeData({ selectedRuleId: "missing" });
        const { unmount } = render(() => MeasureView({ data, onSelectRule: () => {} }));
        expect(screen.getByText("The chamber is empty.")).toBeInTheDocument();
        expect(screen.getByText("No atoms yet.")).toBeInTheDocument();
        expect(screen.getByText("Recording starts once the sim runs.")).toBeInTheDocument();
        expect(screen.getByText("No reactions in the last ten seconds.")).toBeInTheDocument();
        expect(screen.getByText("No reaction rules loaded.")).toBeInTheDocument();
        expect(screen.getByText("Add dissolved metals to compare couples.")).toBeInTheDocument();
        expect(screen.getByText("0 kJ")).toBeInTheDocument();
        unmount();
    });

    it("falls back to the first rule and shows absorbed energy", () => {
        const data = makeData({
            rules: [rule("rule-a", 0, 40)],
            selectedRuleId: "unknown",
            energy: 75,
            samples: [
                { time: 0, temperature: 5, pressure: 1, ph: 7, molecules: 5, energy: 0 },
                { time: 1, temperature: 5, pressure: 1, ph: 7, molecules: 5, energy: 0 },
            ],
        });
        const { unmount } = render(() => MeasureView({ data, onSelectRule: () => {} }));
        expect(screen.getByText("+75 kJ absorbed")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        unmount();
    });
});
