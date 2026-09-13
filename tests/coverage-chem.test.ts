import { describe, expect, it } from "vitest";
import { ElementRegistry } from "../src/chem/ElementRegistry";
import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";
import { SmilesParser } from "../src/chem/SmilesParser";
import { SnapshotCodec } from "../src/state/SnapshotCodec";
import type {
    CompactBond,
    ICompactMoleculeSpec,
    IMoleculeRecord,
} from "../src/chem/MoleculeRecord";

interface IResidueSide {
    heavy: string[];
    bonds: CompactBond[];
    extraH: number[];
}

interface ICatalogInternals {
    phenyl(
        start: number,
        attach: number,
    ): { heavy: string[]; bonds: CompactBond[]; ring: number[] };
    residueSide(code: string): IResidueSide;
    stampAminoAcid(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        code: string,
        extraBonds?: CompactBond[],
        extraHeavy?: string[],
        extraH?: Array<readonly [number, number]>,
    ): ICompactMoleculeSpec;
    buildProtein(
        chains: ReadonlyArray<string>,
        disulfides: ReadonlyArray<readonly [number, number, number, number]>,
        cAmides: ReadonlyArray<boolean>,
    ): { heavy: string[]; bonds: CompactBond[]; extraH: Array<readonly [number, number]> };
    findSpec(pool: ICompactMoleculeSpec[], id: string): ICompactMoleculeSpec;
}

const catalogInternals = MoleculeCatalog as unknown as ICatalogInternals;

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

describe("SmilesParser branch extras", () => {
    it("closes a ring with a stereo marker on both ends", () => {
        const parsed = new SmilesParser().parse("C/1CC1");
        expect(parsed.bonds.some((bond) => bond[3] !== undefined)).toBe(true);
        const second = new SmilesParser().parse("C1C/1");
        expect(second.bonds.some((bond) => bond[3] !== undefined)).toBe(true);
    });

    it("applies stereo to a double bond that carries a marker", () => {
        const parsed = new SmilesParser().parse("C=/C");
        expect(parsed.bonds.some((bond) => bond[2] === 2 && bond[3] !== undefined)).toBe(true);
    });

    it("treats a wildcard bracket as carbon", () => {
        const parsed = new SmilesParser().parse("[*]");
        expect(parsed.heavy).toEqual(["C"]);
    });

    it("recovers from an unmatched close parenthesis", () => {
        const parsed = new SmilesParser().parse("C)N");
        expect(parsed.heavy.length).toBe(2);
        expect(parsed.bonds.length).toBe(0);
    });

    it("parses repeated plus and minus charge tokens", () => {
        expect(new SmilesParser().parse("[Ca++]").charges).toEqual([[0, 2]]);
        expect(new SmilesParser().parse("[Fe---]").charges).toEqual([[0, -3]]);
        expect(new SmilesParser().parse("[Fe+0]").charges).toEqual([[0, 1]]);
        expect(new SmilesParser().parse("[Fe-0]").charges).toEqual([[0, -1]]);
    });
});

describe("MoleculeCatalog reachable internals", () => {
    it("attaches a phenyl ring when a link index is supplied", () => {
        const built = catalogInternals.phenyl(0, 3);
        expect(built.ring.length).toBe(6);
        expect(built.bonds.some((bond) => bond[0] === 3 && bond[1] === 0)).toBe(true);
    });

    it("throws on an unknown residue code", () => {
        expect(() => catalogInternals.residueSide("?")).toThrow();
    });

    it("maps a missing clone source to an error", () => {
        expect(() => catalogInternals.findSpec([], "nope")).toThrow();
    });

    it("covers residue graph offsets for proline and a C-terminal amide", () => {
        catalogInternals.stampAminoAcid("pro-test", "Pro Test", "C2", "CC", "P");
        const protein = catalogInternals.buildProtein(["GP"], [], [true]);
        expect(protein.heavy.length).toBeGreaterThan(0);
        expect(protein.bonds.some((bond) => bond[2] === 1 && bond[0] !== bond[1])).toBe(true);
    });

    it("maps synthetic residue anchors used by no catalog entry", () => {
        const original = catalogInternals.residueSide;
        try {
            catalogInternals.residueSide = () => ({
                heavy: ["C", "C"],
                bonds: [[-2, -1, 1]],
                extraH: [],
            });
            expect(
                catalogInternals.stampAminoAcid("syn", "Syn", "C2", "CC", "Z").heavy.length,
            ).toBe(7);
            const protein = catalogInternals.buildProtein(["Z"], [], [false]);
            expect(protein.bonds.some((bond) => bond[0] === 0 && bond[1] === 1)).toBe(true);
        } finally {
            catalogInternals.residueSide = original;
        }
    });

    it("formats leftover elements and explicit hydrogen counts", () => {
        expect(MoleculeCatalog.formulaOf(["Xx"], [])).toBe("Xx");
        expect(MoleculeCatalog.formulaOf(["Xx", "Xx"], [])).toBe("Xx2");
        expect(MoleculeCatalog.formulaOf(["C"], [], [], [[0, 4]])).toBe("CH4");
        expect(MoleculeCatalog.formulaOf(["C"], [], [], [[0, 0]])).toBe("C");
    });
});

describe("ElementRegistry bond fallbacks", () => {
    it("falls back to radii for order four without a single entry", () => {
        const length = ElementRegistry.bondLength("S", "O", 4);
        expect(Number.isFinite(length)).toBe(true);
        expect(length).toBeGreaterThan(1);
        expect(length).toBeCloseTo(ElementRegistry.bondLength("S", "O", 1) - 0.12, 5);
    });
});

describe("MoleculeFactory branch extras", () => {
    it("keeps stereo when a same-order duplicate fills a null slot", () => {
        const bonds = MoleculeFactory.dedupeBonds([
            [0, 1, 1],
            [0, 1, 1, "Z"],
        ]);
        expect(bonds.length).toBe(1);
        expect(bonds[0].stereo).toBe("Z");
    });

    it("exhausts directions for a hyper-coordinated atom", () => {
        const spec = {
            id: "five-way",
            name: "Five Way",
            formula: "C6",
            smiles: "C",
            category: "functional",
            tags: [],
            warn: false,
            inchi: "",
            heavy: ["C", "C", "C", "C", "C", "C"],
            bonds: [
                [0, 1, 1],
                [0, 2, 1],
                [0, 3, 1],
                [0, 4, 1],
                [0, 5, 1],
            ],
            charges: [],
            explicitH: [],
        } as unknown as ICompactMoleculeSpec;
        const placed = (
            MoleculeFactory as unknown as {
                embedHeavy(
                    value: ICompactMoleculeSpec,
                    bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
                ): Array<{ el: string; x: number; y: number; z: number }>;
            }
        ).embedHeavy(spec, [
            { a: 0, b: 1, order: 1 },
            { a: 0, b: 2, order: 1 },
            { a: 0, b: 3, order: 1 },
            { a: 0, b: 4, order: 1 },
            { a: 0, b: 5, order: 1 },
        ]);
        expect(placed.length).toBe(6);
    });
});

describe("MoleculeValidator fallback branches", () => {
    it("reports an element missing from the graph but present in the formula", () => {
        const validator = new MoleculeValidator();
        const record = makeRecord({
            formula: "CH4",
            mass: 12.011,
            atoms: [{ el: "C", x: 0, y: 0, z: 0, charge: 0, stereo: null, aromatic: false }],
            bonds: [],
        });
        const result = validator.validate(record);
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("formula mismatch");
    });

    it("reports an element in the graph but missing from the formula", () => {
        const validator = new MoleculeValidator();
        const record = makeRecord({
            formula: "C",
            mass: 13.019,
        });
        const result = validator.validate(record);
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toContain("formula mismatch");
    });
});

describe("SnapshotCodec branch extras", () => {
    function encodeText(text: string): string {
        return Buffer.from(text, "utf8")
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    it("recovers when every numeric field parses to zero", () => {
        const hash = encodeText("v1;p;s0;t0;r0.00;h0.0;v0.00;o0.00;g0.00");
        const decoded = SnapshotCodec.decode("#" + hash);
        expect(decoded).not.toBeNull();
        expect(decoded?.seed).toBe(1);
        expect(decoded?.temperature).toBe(298);
        expect(decoded?.pressure).toBe(1);
        expect(decoded?.ph).toBe(7);
        expect(decoded?.viscosity).toBe(0.2);
        expect(decoded?.polarity).toBe(0.5);
        expect(decoded?.gravity).toBe(0);
    });

    it("filters spawn counts outside the allowed window", () => {
        const hash = encodeText("v1;H2Ox0;H2Ox600;H2Ox12");
        const decoded = SnapshotCodec.decode(hash);
        expect(decoded?.spawns).toEqual([{ id: "H2O", count: 12 }]);
    });

    it("ignores a v-prefixed part that is neither version nor viscosity", () => {
        const hash = encodeText("v1;vx");
        const decoded = SnapshotCodec.decode(hash);
        expect(decoded?.viscosity).toBe(0.2);
    });

    it("pads base64url input and returns null for garbage", () => {
        const padded = encodeText("v1;s7");
        expect(SnapshotCodec.decode("#" + padded)?.seed).toBe(7);
        expect(SnapshotCodec.decode("#%%%%")).toBeNull();
    });
});
