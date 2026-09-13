import { render, fireEvent, screen, cleanup } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";
import type { IElementReference, IReferenceData } from "../src/chem/ElementReference";
import { ReferenceView } from "../src/ui/ReferenceView";

afterEach(() => {
    cleanup();
});

function element(overrides: Partial<IElementReference>): IElementReference {
    return {
        number: 1,
        symbol: "H",
        name: "Hydrogen",
        mass: 1.008,
        covalentRadius: 0.31,
        vdwRadius: 1.2,
        color: "#ffffff",
        maxValence: 1,
        electronegativity: 2.2,
        kind: "nonmetal",
        cations: [],
        anion: -1,
        anionName: "hydride",
        period: 1,
        group: 1,
        fBlock: false,
        ...overrides,
    };
}

function makeData(): IReferenceData {
    return {
        elements: [
            element({}),
            element({
                number: 2,
                symbol: "He",
                name: "Helium",
                electronegativity: 0,
                kind: "noble",
                anion: null,
                anionName: "",
                period: 1,
                group: 18,
            }),
            element({
                number: 11,
                symbol: "Na",
                name: "Sodium",
                electronegativity: 0.93,
                kind: "alkali",
                cations: [1],
                anion: null,
                anionName: "",
                period: 3,
                group: 1,
                mass: 22.99,
            }),
            element({
                number: 12,
                symbol: "Mg",
                name: "Magnesium",
                electronegativity: 1.31,
                kind: "alkaline",
                cations: [2],
                anion: null,
                anionName: "",
                period: 3,
                group: 2,
                mass: 24.31,
            }),
            element({
                number: 17,
                symbol: "Cl",
                name: "Chlorine",
                electronegativity: 3.16,
                kind: "halogen",
                cations: [],
                anion: -1,
                anionName: "chloride",
                period: 3,
                group: 17,
                mass: 35.45,
            }),
            element({
                number: 57,
                symbol: "La",
                name: "Lanthanum",
                kind: "lanthanide",
                period: 6,
                group: 3,
                fBlock: true,
            }),
            element({
                number: 89,
                symbol: "Ac",
                name: "Actinium",
                kind: "actinide",
                period: 7,
                group: 3,
                fBlock: true,
            }),
        ],
        constants: [{ label: "Gas constant R", detail: "8.314 J/(mol·K)" }],
        equations: [{ label: "pH", detail: "pH = -log10[H+]" }],
    };
}

describe("ReferenceView", () => {
    it("shows details for the selected element and f-block elements", () => {
        const { unmount } = render(() => ReferenceView({ data: makeData() }));
        expect(screen.getByText("Hydrogen")).toBeInTheDocument();
        fireEvent.click(screen.getByTitle("Sodium (11)"));
        expect(screen.getByText("Sodium")).toBeInTheDocument();
        fireEvent.click(screen.getByTitle("Helium (2)"));
        expect(screen.getByText("Helium")).toBeInTheDocument();
        fireEvent.click(screen.getByTitle("Lanthanum (57)"));
        expect(screen.getByText("Lanthanum")).toBeInTheDocument();
        fireEvent.click(screen.getByTitle("Actinium (89)"));
        expect(screen.getByText("Actinium")).toBeInTheDocument();
        unmount();
    });

    it("switches the period trend and the ion pair", () => {
        const { unmount } = render(() => ReferenceView({ data: makeData() }));
        const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
        fireEvent.change(selects[0], { target: { value: "3" } });
        expect(screen.getByText("Sodium hydride")).toBeInTheDocument();
        fireEvent.change(selects[1], { target: { value: "Mg" } });
        fireEvent.change(selects[2], { target: { value: "Cl" } });
        expect(screen.getByText("MgCl2")).toBeInTheDocument();
        expect(screen.getByText("Magnesium chloride")).toBeInTheDocument();
        unmount();
    });

    it("renders empty fallbacks", () => {
        const { unmount } = render(() =>
            ReferenceView({ data: { elements: [], constants: [], equations: [] } }),
        );
        expect(screen.getByText("Pick an element.")).toBeInTheDocument();
        expect(screen.getByText("No ion pairs available.")).toBeInTheDocument();
        unmount();
    });
});
