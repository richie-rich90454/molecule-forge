import { describe, expect, it } from "vitest";
import { ElementReference, type IElementReference } from "../src/chem/ElementReference";

function makeElement(overrides: Partial<IElementReference>): IElementReference {
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

describe("ElementReference", () => {
    it("lists every registered element in atomic order", () => {
        const elements = ElementReference.elements();
        expect(elements.length).toBeGreaterThan(90);
        expect(elements[0].symbol).toBe("H");
        expect(elements[0].name).toBe("Hydrogen");
    });

    it("places elements in their period and group", () => {
        expect(ElementReference.position(1)).toEqual({ period: 1, group: 1, fBlock: false });
        expect(ElementReference.position(2)).toEqual({ period: 1, group: 18, fBlock: false });
        expect(ElementReference.position(6).group).toBe(14);
        expect(ElementReference.position(11)).toEqual({ period: 3, group: 1, fBlock: false });
        expect(ElementReference.position(17).group).toBe(17);
        expect(ElementReference.position(19).period).toBe(4);
        expect(ElementReference.position(36).group).toBe(18);
        expect(ElementReference.position(37).period).toBe(5);
        expect(ElementReference.position(55).group).toBe(1);
        expect(ElementReference.position(57).fBlock).toBe(true);
        expect(ElementReference.position(71).fBlock).toBe(true);
        expect(ElementReference.position(74).group).toBe(6);
        expect(ElementReference.position(89).fBlock).toBe(true);
        expect(ElementReference.position(94).period).toBe(7);
        expect(ElementReference.position(104)).toEqual({ period: 7, group: 4, fBlock: false });
    });

    it("returns a period ordered by group", () => {
        const elements = ElementReference.elements();
        const period3 = ElementReference.periodTrend(elements, 3);
        expect(period3[0].symbol).toBe("Na");
        expect(period3[period3.length - 1].symbol).toBe("Ar");
        for (let i = 1; i < period3.length; i++) {
            expect(period3[i].group).toBeGreaterThan(period3[i - 1].group);
        }
    });

    it("names ionic compounds with balanced subscripts", () => {
        const magnesium = makeElement({
            symbol: "Mg",
            name: "Magnesium",
            cations: [2],
            anion: null,
        });
        const chlorine = makeElement({
            symbol: "Cl",
            name: "Chlorine",
            cations: [],
            anion: -1,
            anionName: "chloride",
        });
        expect(ElementReference.nomenclature(magnesium, 2, chlorine)).toEqual({
            formula: "MgCl2",
            name: "Magnesium chloride",
        });
        const sodium = makeElement({ symbol: "Na", name: "Sodium", cations: [1], anion: null });
        expect(ElementReference.nomenclature(sodium, 1, chlorine)).toEqual({
            formula: "NaCl",
            name: "Sodium chloride",
        });
        const oxygen = makeElement({
            symbol: "O",
            name: "Oxygen",
            anion: -2,
            anionName: "oxide",
        });
        expect(ElementReference.nomenclature(sodium, 1, oxygen)).toEqual({
            formula: "Na2O",
            name: "Sodium oxide",
        });
    });

    it("exposes constants and equations", () => {
        expect(ElementReference.constants().length).toBeGreaterThan(0);
        expect(ElementReference.equations().length).toBeGreaterThan(0);
    });
});
