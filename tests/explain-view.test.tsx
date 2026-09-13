import { render, screen, cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import type { IExplainData } from "../src/chem/ReactionExplainer";
import type { IMoleculeExplanation } from "../src/chem/MoleculeExplainer";
import { ExplainView } from "../src/ui/ExplainView";

afterEach(() => {
    cleanup();
});

function molecule(overrides: Partial<IMoleculeExplanation>): IMoleculeExplanation {
    return {
        id: "water",
        name: "Water",
        formula: "H2O",
        mass: 18,
        category: "functional",
        atomCount: 3,
        atomCounts: [
            { element: "H", count: 2 },
            { element: "O", count: 1 },
        ],
        netCharge: 0,
        donors: 2,
        acceptors: 2,
        rotatable: 0,
        tpsa: 0,
        logP: -1,
        aromaticRings: 0,
        groups: [{ label: "hydroxyl (-OH)", count: 1 }],
        hazard: false,
        summary: "Water is small.",
        ...overrides,
    };
}

const fullReaction: IExplainData = {
    reaction: {
        ruleId: "combustion-methane",
        name: "Combustion methane",
        equation: "1 CH4 + 2 O2 -> 1 CO2 + 2 H2O",
        deltaH: -890,
        activationEnergy: 120,
        rateLaw: "rate = k[CH4][O2]",
        reference: "NIST",
        conditions: "at least 700 K",
        message: "Methane burns.",
    },
    molecule: molecule({ netCharge: 1, hazard: true }),
};

describe("ExplainView", () => {
    it("renders a full reaction and molecule card", () => {
        const { unmount } = render(() => ExplainView({ data: fullReaction }));
        expect(screen.getByText("Combustion methane")).toBeInTheDocument();
        expect(screen.getByText("1 CH4 + 2 O2 -> 1 CO2 + 2 H2O")).toBeInTheDocument();
        expect(screen.getByText("-890 kJ/mol (released)")).toBeInTheDocument();
        expect(screen.getByText("120 kJ/mol")).toBeInTheDocument();
        expect(screen.getByText("rate = k[CH4][O2]")).toBeInTheDocument();
        expect(screen.getByText("NIST")).toBeInTheDocument();
        expect(screen.getByText("Water")).toBeInTheDocument();
        expect(screen.getByText("hydroxyl (-OH)")).toBeInTheDocument();
        expect(screen.getByText("Handle with care")).toBeInTheDocument();
        unmount();
    });

    it("hides absent fields and reports zero and absorbed energy", () => {
        const data: IExplainData = {
            reaction: {
                ruleId: "synthesis-x",
                name: "Synthesis x",
                equation: "",
                deltaH: 0,
                activationEnergy: null,
                rateLaw: "",
                reference: "",
                conditions: "Emergent reaction",
                message: "x",
            },
            molecule: molecule({
                groups: [],
                atomCounts: [],
                netCharge: 0,
                hazard: false,
            }),
        };
        const { unmount } = render(() => ExplainView({ data }));
        expect(screen.getByText("0 kJ/mol (no net change)")).toBeInTheDocument();
        expect(screen.queryByText("Activation energy")).toBeNull();
        expect(screen.queryByText("Rate law")).toBeNull();
        expect(screen.queryByText("Reference")).toBeNull();
        unmount();

        const absorbed = render(() =>
            ExplainView({
                data: {
                    reaction: { ...data.reaction!, deltaH: 55 },
                    molecule: null,
                },
            }),
        );
        expect(screen.getByText("+55 kJ/mol (absorbed)")).toBeInTheDocument();
        expect(screen.getByText("Select a molecule in the library.")).toBeInTheDocument();
        absorbed.unmount();
    });

    it("renders empty fallbacks", () => {
        const { unmount } = render(() => ExplainView({ data: { reaction: null, molecule: null } }));
        expect(
            screen.getByText("No reaction yet. Click a log line or run the chamber."),
        ).toBeInTheDocument();
        expect(screen.getByText("Select a molecule in the library.")).toBeInTheDocument();
        unmount();
    });
});
