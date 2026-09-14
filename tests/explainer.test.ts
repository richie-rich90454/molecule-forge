import { describe, expect, it } from "vitest";
import { MoleculeExplainer } from "../src/chem/MoleculeExplainer";
import { ReactionExplainer } from "../src/chem/ReactionExplainer";
import type {
    IBondSpec,
    IMoleculeRecord,
    IMoleculeRegistry,
    MoleculeCategory,
} from "../src/chem/MoleculeRecord";
import type { IReactionRule } from "../src/sim/ReactionCatalog";
import type { IReactionEvent } from "../src/sim/ReactionEngine";

interface IAtom {
    el: string;
    charge?: number;
    aromatic?: boolean;
}

function makeRecord(
    atoms: ReadonlyArray<IAtom>,
    bonds: ReadonlyArray<readonly [number, number, number]>,
    properties: Partial<IMoleculeRecord["properties"]>,
    warn: boolean = false,
): IMoleculeRecord {
    return {
        id: "test",
        name: "Test",
        formula: "X",
        smiles: "",
        inchi: "",
        category: "functional",
        tags: [],
        warn,
        mass: atoms.length,
        atoms: atoms.map((atom, index) => ({
            el: atom.el,
            x: index,
            y: 0,
            z: 0,
            charge: atom.charge ?? 0,
            stereo: null,
            aromatic: atom.aromatic ?? false,
        })),
        bonds: bonds.map<IBondSpec>((bond) => ({
            a: bond[0],
            b: bond[1],
            order: bond[2] as IBondSpec["order"],
            aromatic: false,
            stereo: null,
        })),
        properties: {
            logP: 0,
            hBondDonors: 0,
            hBondAcceptors: 0,
            rotatable: 0,
            tpsa: 0,
            ...properties,
        },
        provenance: { source: "test", generatorVersion: "0", smilesCanonical: "" },
    };
}

describe("MoleculeExplainer", () => {
    it("detects functional groups and aromatic rings", () => {
        const atoms: IAtom[] = [
            { el: "O" },
            { el: "H" },
            { el: "C" },
            { el: "O" },
            { el: "O" },
            { el: "H" },
            { el: "C" },
            { el: "O" },
            { el: "N" },
            { el: "H" },
            { el: "C" },
            { el: "N" },
            { el: "C", aromatic: true },
            { el: "C", aromatic: true },
            { el: "C", aromatic: true },
            { el: "C", aromatic: true },
            { el: "C", aromatic: true },
            { el: "C", aromatic: true },
        ];
        const bonds: Array<readonly [number, number, number]> = [
            [0, 1, 1],
            [2, 3, 2],
            [2, 4, 1],
            [4, 5, 1],
            [6, 7, 2],
            [8, 9, 1],
            [10, 11, 3],
        ];
        const explanation = MoleculeExplainer.explain(
            makeRecord(atoms, bonds, { tpsa: 80, hBondDonors: 2, hBondAcceptors: 3 }, true),
        );
        expect(explanation.groups.map((group) => group.label)).toEqual([
            "hydroxyl (-OH)",
            "carbonyl (C=O)",
            "carboxyl (-COOH)",
            "amine (N-H)",
            "nitrile (C≡N)",
        ]);
        expect(explanation.aromaticRings).toBe(1);
        expect(explanation.hazard).toBe(true);
        expect(explanation.summary).toContain("highly polar");
        expect(explanation.summary).toContain("hydrogen bond");
        expect(explanation.netCharge).toBe(0);
    });

    it("summarizes charge, size, and polarity", () => {
        const positive = MoleculeExplainer.explain(
            makeRecord([{ el: "Na", charge: 1 }], [], { tpsa: 5 }),
        );
        expect(positive.summary).toContain("positively charged (+1)");
        expect(positive.summary).toContain("largely nonpolar");
        expect(positive.summary).toContain("cannot donate or accept hydrogen bonds");
        expect(positive.groups.length).toBe(0);

        const negative = MoleculeExplainer.explain(
            makeRecord([{ el: "Cl", charge: -1 }], [], { tpsa: 30 }),
        );
        expect(negative.summary).toContain("negatively charged (-1)");
        expect(negative.summary).toContain("polar");

        const bigAtoms: IAtom[] = [];
        for (let i = 0; i < 30; i++) {
            bigAtoms.push({ el: "C" });
        }
        const big = MoleculeExplainer.explain(
            makeRecord(bigAtoms, [], { tpsa: 0, hBondDonors: 1, hBondAcceptors: 0 }),
        );
        expect(big.summary).toContain("large");
        expect(big.atomCounts[0].element).toBe("C");
    });

    it("breaks atom-count ties and singularizes hydrogen bonding", () => {
        const tie = MoleculeExplainer.explain(
            makeRecord([{ el: "C" }, { el: "O" }], [], {
                tpsa: 20,
                hBondDonors: 1,
                hBondAcceptors: 1,
            }),
        );
        expect(tie.atomCounts.map((tally) => tally.element)).toEqual(["C", "O"]);
        expect(tie.summary).toContain("polar");
        expect(tie.summary).toContain("1 donor, 1 acceptor");
    });
});

class FakeRegistry implements IMoleculeRegistry {
    private readonly records: Map<string, IMoleculeRecord>;

    public constructor(records: ReadonlyArray<IMoleculeRecord>) {
        this.records = new Map(records.map((record) => [record.id, record]));
    }

    public getCategories(): ReadonlyArray<MoleculeCategory> {
        return ["functional"];
    }

    public getRecords(): ReadonlyArray<IMoleculeRecord> {
        return [];
    }

    public getCategoryIds(): ReadonlyArray<string> {
        return Array.from(this.records.keys());
    }

    public getBuiltRecord(id: string): IMoleculeRecord | undefined {
        return this.records.get(id);
    }

    public getAllRecords(): ReadonlyArray<IMoleculeRecord> {
        return Array.from(this.records.values());
    }

    public findById(id: string): IMoleculeRecord | undefined {
        return this.records.get(id);
    }

    public getCount(): number {
        return this.records.size;
    }
}

function makeRule(overrides: Partial<IReactionRule>): IReactionRule {
    return {
        id: "test-rule",
        reactants: [{ category: null, tag: null, moleculeId: "water", count: 2 }],
        products: [{ moleculeId: "water", count: 2 }],
        conditions: {
            tempMin: null,
            tempMax: null,
            needsSpark: false,
            needsCatalyst: false,
            phMin: null,
            phMax: null,
        },
        activationEnergy: 100,
        deltaH: -50,
        visual: { flash: "#fff", particles: "puff" },
        rateLaw: "rate = k[water]",
        reference: "ref",
        message: "msg",
        ...overrides,
    };
}

const water = makeRecord([{ el: "O" }, { el: "H" }, { el: "H" }], [], {});
const registry = new FakeRegistry([{ ...water, id: "water", name: "Water", formula: "H2O" }]);

describe("ReactionExplainer", () => {
    it("builds an equation and describes conditions", () => {
        const explanation = ReactionExplainer.explain(
            makeRule({
                reactants: [{ category: null, tag: null, moleculeId: "water", count: 2 }],
                products: [
                    { moleculeId: "water", count: 1 },
                    { moleculeId: "missing", count: 1 },
                ],
                conditions: {
                    tempMin: 300,
                    tempMax: 900,
                    needsSpark: true,
                    needsCatalyst: true,
                    phMin: 2,
                    phMax: 12,
                },
            }),
            registry,
        );
        expect(explanation.equation).toBe("2 H2O -> H2O + missing");
        expect(explanation.conditions).toContain("at least 300 K");
        expect(explanation.conditions).toContain("at most 900 K");
        expect(explanation.conditions).toContain("needs a spark");
        expect(explanation.conditions).toContain("needs a catalyst");
        expect(explanation.conditions).toContain("pH at least 2");
        expect(explanation.conditions).toContain("pH at most 12");
        expect(explanation.activationEnergy).toBe(100);
        expect(explanation.deltaH).toBe(-50);
    });

    it("handles rules without products and without conditions", () => {
        const explanation = ReactionExplainer.explain(
            makeRule({ products: [], deltaH: 20 }),
            registry,
        );
        expect(explanation.equation).toBe("2 H2O");
        expect(explanation.conditions).toBe("No special conditions");
    });

    it("explains emergent events without a matching rule", () => {
        const event: IReactionEvent = {
            ruleId: "synthesis-h2o",
            message: "Water forms.",
            x: 0,
            y: 0,
            z: 0,
            flash: "#fff",
            particles: "link",
            deltaH: -285,
        };
        const explanation = ReactionExplainer.fromEvent(event, [makeRule({})], registry);
        expect(explanation.name).toBe("Synthesis h2o");
        expect(explanation.equation).toBe("");
        expect(explanation.deltaH).toBe(-285);
        expect(explanation.activationEnergy).toBeNull();

        const known = ReactionExplainer.fromEvent(
            { ...event, ruleId: "test-rule", deltaH: undefined },
            [makeRule({})],
            registry,
        );
        expect(known.equation).toBe("2 H2O -> 2 H2O");
        expect(known.deltaH).toBe(-50);
    });
});
