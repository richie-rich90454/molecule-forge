import { describe, expect, it } from "vitest";
import { ElementRegistry } from "../src/chem/ElementRegistry";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";
import type { IMoleculeRecord } from "../src/chem/MoleculeRecord";

function makeRecord(overrides: Partial<IMoleculeRecord>): IMoleculeRecord {
    return {
        id: "test-case",
        name: "Test Case",
        formula: "H2",
        smiles: "[H][H]",
        inchi: "",
        category: "functional",
        tags: [],
        warn: false,
        mass: 2.016,
        atoms: [
            { el: "H", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
            { el: "H", x: 0.74, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
        ],
        bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null }],
        properties: { logP: 0, hBondDonors: 0, hBondAcceptors: 0, rotatable: 0, tpsa: 0 },
        provenance: { source: "test", generatorVersion: "0", smilesCanonical: "" },
        ...overrides,
    };
}

describe("ElementRegistry", () => {
    it("returns info for known elements", () => {
        expect(ElementRegistry.get("C").number).toBe(6);
        expect(ElementRegistry.get("Fe").mass).toBeGreaterThan(55);
    });

    it("throws for unknown elements", () => {
        expect(() => ElementRegistry.get("Xx")).toThrow();
    });

    it("reports presence and symbols", () => {
        expect(ElementRegistry.has("O")).toBe(true);
        expect(ElementRegistry.has("Xx")).toBe(false);
        expect(ElementRegistry.getSymbols().length).toBeGreaterThan(90);
        expect(ElementRegistry.getSymbols()).toContain("U");
    });

    it("looks up reference bond lengths", () => {
        expect(ElementRegistry.bondLength("C", "O", 2)).toBeCloseTo(1.21, 5);
        expect(ElementRegistry.bondLength("O", "C", 2)).toBeCloseTo(1.21, 5);
        expect(ElementRegistry.bondLength("C", "C", 2)).toBeCloseTo(1.34, 5);
        expect(ElementRegistry.bondLength("C", "C", 3)).toBeCloseTo(1.2, 5);
        expect(ElementRegistry.bondLength("N", "N", 3)).toBeCloseTo(0.71 + 0.71 - 0.34, 5);
        expect(ElementRegistry.bondLength("N", "N", 2)).toBeCloseTo(0.71 + 0.71 - 0.2, 5);
        expect(ElementRegistry.bondLength("C", "C", 4)).toBeCloseTo(1.42, 5);
        expect(ElementRegistry.bondLength("N", "N", 4)).toBeCloseTo(0.71 + 0.71 - 0.12, 5);
        expect(ElementRegistry.bondLength("C", "C", 1)).toBeCloseTo(1.54, 5);
        expect(ElementRegistry.bondLength("H", "C", 1)).toBeCloseTo(1.09, 5);
        expect(ElementRegistry.bondLength("Na", "Cl", 1)).toBeCloseTo(2.68, 5);
    });

    it("counts implicit hydrogens per element rules", () => {
        expect(ElementRegistry.implicitHydrogens("H", 1, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("C", 2, 0)).toBe(2);
        expect(ElementRegistry.implicitHydrogens("N", 4, 1)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("N", 1, 0)).toBe(2);
        expect(ElementRegistry.implicitHydrogens("O", 1, -1)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("O", 1, 0)).toBe(1);
        expect(ElementRegistry.implicitHydrogens("S", 6, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("Se", 1, 0)).toBe(1);
        expect(ElementRegistry.implicitHydrogens("S", 1, 0)).toBe(1);
        expect(ElementRegistry.implicitHydrogens("P", 5, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("P", 3, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("F", 1, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("Cl", 1, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("Br", 1, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("I", 1, 0)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("Na", 0, 1)).toBe(0);
        expect(ElementRegistry.implicitHydrogens("Fe", 4, 0)).toBe(0);
    });
});

describe("MoleculeFactoryExtras", () => {
    it("dedupes bonds keeping the strongest order", () => {
        const factory = new MoleculeFactory();
        const spec = {
            id: "dupe",
            name: "Dupe",
            formula: "C2H6",
            smiles: "CC",
            category: "alkanes" as const,
            tags: [],
            warn: false,
            inchi: "",
            heavy: ["C", "C"],
            bonds: [
                [0, 1, 1],
                [1, 0, 2, "E"],
                [0, 1, 1],
            ] as Array<readonly [number, number, number, string?]>,
            charges: [],
            explicitH: [],
        };
        const record = factory.build(spec);
        const heavy = record.bonds.filter(
            (bond) => record.atoms[bond.a].el === "C" && record.atoms[bond.b].el === "C",
        );
        expect(heavy.length).toBe(1);
        expect(heavy[0].order).toBe(2);
        expect(heavy[0].stereo).toBe("E");
        expect(record.bonds.length).toBe(heavy.length + 4);
    });

    it("marks tetrahedral stereocenters R and S", () => {
        const factory = new MoleculeFactory();
        const spec = {
            id: "stereo",
            name: "Stereo",
            formula: "C2F2Cl2Br2",
            smiles: "FC(Cl)(Br)C(F)(Cl)Br",
            category: "functional" as const,
            tags: [],
            warn: false,
            inchi: "",
            heavy: ["C", "C", "F", "Cl", "Br", "F", "Cl", "Br"],
            bonds: [
                [0, 1, 1],
                [0, 2, 1],
                [0, 3, 1],
                [0, 4, 1],
                [1, 5, 1],
                [1, 6, 1],
                [1, 7, 1],
            ] as Array<readonly [number, number, number]>,
            charges: [],
            explicitH: [],
        };
        const record = factory.build(spec);
        expect(record.atoms[0].stereo).toBe("R");
        expect(record.atoms[1].stereo).toBe("S");
    });

    it("clamps unknown high bond orders to single", () => {
        const factory = new MoleculeFactory();
        const spec = {
            id: "weird",
            name: "Weird",
            formula: "C2H6",
            smiles: "CC",
            category: "alkanes" as const,
            tags: [],
            warn: false,
            inchi: "",
            heavy: ["C", "C"],
            bonds: [[0, 1, 9]] as Array<readonly [number, number, number]>,
            charges: [],
            explicitH: [],
        };
        const record = factory.build(spec);
        expect(record.bonds[0].order).toBe(1);
    });

    it("places disconnected counterions apart", () => {
        const factory = new MoleculeFactory();
        const spec = {
            id: "salt",
            name: "Salt",
            formula: "NaCl",
            smiles: "[Na+].[Cl-]",
            category: "functional" as const,
            tags: [],
            warn: false,
            inchi: "",
            heavy: ["Na", "Cl"],
            bonds: [] as Array<readonly [number, number, number]>,
            charges: [
                [0, 1],
                [1, -1],
            ] as Array<readonly [number, number]>,
            explicitH: [],
        };
        const record = factory.build(spec);
        const dx = record.atoms[0].x - record.atoms[1].x;
        expect(Math.abs(dx)).toBeGreaterThan(2);
        expect(record.atoms[0].charge).toBe(1);
        expect(record.atoms[1].charge).toBe(-1);
    });
});

describe("MoleculeRegistryExtras", () => {
    it("returns records per category and empty for unknown", () => {
        const registry = new MoleculeRegistry(new MoleculeFactory());
        expect(registry.getRecords("alkanes").length).toBeGreaterThan(0);
        expect(registry.getRecords("nope" as never).length).toBe(0);
        expect(registry.findById("missing-id")).toBeUndefined();
    });

    it("counts tags across the library", () => {
        const registry = new MoleculeRegistry(new MoleculeFactory());
        const counts = registry.getTagCounts();
        expect(counts.get("gas")).toBeGreaterThan(10);
    });
});

describe("MoleculeValidatorCases", () => {
    it("rejects unknown elements", () => {
        const validator = new MoleculeValidator();
        const record = makeRecord({
            atoms: [{ el: "Xx", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false }],
            bonds: [],
            formula: "Xx",
            mass: 1,
        });
        const result = validator.validate(record);
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("unknown element");
    });

    it("rejects out of range and self bonds", () => {
        const validator = new MoleculeValidator();
        const badIndex = makeRecord({
            bonds: [{ a: 0, b: 5, order: 1, aromatic: false, stereo: null }],
        });
        expect(validator.validate(badIndex).valid).toBe(false);
        const selfBond = makeRecord({
            bonds: [{ a: 1, b: 1, order: 1, aromatic: false, stereo: null }],
        });
        expect(validator.validate(selfBond).valid).toBe(false);
    });

    it("rejects exceeded valence", () => {
        const validator = new MoleculeValidator();
        const record = makeRecord({
            formula: "CH5",
            mass: 17.035,
            atoms: [
                { el: "C", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 1, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: -1, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 0, y: 1, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 0, y: -1, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 0, y: 0, z: 1, charge: 0, stereo: null, aromatic: false },
            ],
            bonds: [
                { a: 0, b: 1, order: 1, aromatic: false, stereo: null },
                { a: 0, b: 2, order: 1, aromatic: false, stereo: null },
                { a: 0, b: 3, order: 1, aromatic: false, stereo: null },
                { a: 0, b: 4, order: 1, aromatic: false, stereo: null },
                { a: 0, b: 5, order: 1, aromatic: false, stereo: null },
            ],
        });
        const result = validator.validate(record);
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("valence");
    });

    it("rejects overlapping atoms and long metal bonds", () => {
        const validator = new MoleculeValidator();
        const close = makeRecord({
            atoms: [
                { el: "H", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 0.1, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
            ],
            bonds: [],
            formula: "H2",
            mass: 2.016,
        });
        expect(validator.validate(close).errors.join(" ")).toContain("too close");
        const longMetal = makeRecord({
            formula: "NaCl",
            mass: 58.44,
            atoms: [
                { el: "Na", x: 0, y: 0, z: 0, charge: 1, stereo: null, aromatic: false },
                { el: "Cl", x: 0, y: 0, z: 5, charge: -1, stereo: null, aromatic: false },
            ],
            bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null }],
        });
        expect(validator.validate(longMetal).errors.join(" ")).toContain("too long");
        const longCovalent = makeRecord({
            atoms: [
                { el: "H", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false },
                { el: "H", x: 0, y: 0, z: 4, charge: 0, stereo: null, aromatic: false },
            ],
            bonds: [{ a: 0, b: 1, order: 1, aromatic: false, stereo: null }],
            formula: "H2",
            mass: 2.016,
        });
        expect(validator.validate(longCovalent).errors.join(" ")).toContain("too long");
    });

    it("rejects formula and mass mismatches", () => {
        const validator = new MoleculeValidator();
        const badFormula = makeRecord({ formula: "H3" });
        expect(validator.validate(badFormula).errors.join(" ")).toContain("formula mismatch");
        const badMass = makeRecord({ mass: 99 });
        expect(validator.validate(badMass).errors.join(" ")).toContain("mass mismatch");
    });

    it("parses formulas with and without counts", () => {
        expect(MoleculeValidator.parseFormula("C6H12O6").get("H")).toBe(12);
        expect(MoleculeValidator.parseFormula("He").get("He")).toBe(1);
    });
});
