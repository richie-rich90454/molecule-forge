import { describe, expect, it } from "vitest";
import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";
import { SmilesParser } from "../src/chem/SmilesParser";

export class SmilesCheck {
    public static formula(smiles: string): string {
        const parsed = new SmilesParser().parse(smiles);
        return MoleculeCatalog.formulaOf(
            parsed.heavy,
            parsed.bonds,
            parsed.charges,
            parsed.explicitH,
        );
    }
}

describe("SmilesParser", () => {
    it("parses chains with explicit single bonds", () => {
        const parsed = new SmilesParser().parse("C-C");
        expect(parsed.heavy).toEqual(["C", "C"]);
        expect(parsed.bonds.length).toBe(1);
        expect(SmilesCheck.formula("C-C")).toBe("C2H6");
    });

    it("parses double and triple bonds", () => {
        expect(SmilesCheck.formula("C=C")).toBe("C2H4");
        expect(SmilesCheck.formula("C#C")).toBe("C2H2");
    });

    it("parses branches and ring closures", () => {
        const parsed = new SmilesParser().parse("CC(C)C");
        expect(parsed.heavy.length).toBe(4);
        expect(parsed.bonds.length).toBe(3);
        expect(SmilesCheck.formula("C1CC1")).toBe("C3H6");
    });

    it("parses aromatic rings with order four bonds", () => {
        const parsed = new SmilesParser().parse("c1ccccc1");
        expect(parsed.heavy.length).toBe(6);
        expect(parsed.bonds.every((b) => b[2] === 4)).toBe(true);
        expect(SmilesCheck.formula("c1ccccc1")).toBe("C6H6");
    });

    it("keeps aromatic to aliphatic links single", () => {
        expect(SmilesCheck.formula("Cc1ccccc1")).toBe("C7H8");
    });

    it("parses explicit aromatic bonds", () => {
        expect(SmilesCheck.formula("c1:c:c:c:c:c1")).toBe("C6H6");
    });

    it("parses heteroaromatics", () => {
        expect(SmilesCheck.formula("c1ccncc1")).toBe("C5H5N");
    });

    it("parses bracket atoms with charges and hydrogens", () => {
        const ammonium = new SmilesParser().parse("[NH4+]");
        expect(ammonium.heavy).toEqual(["N"]);
        expect(ammonium.charges).toEqual([[0, 1]]);
        expect(ammonium.explicitH).toEqual([[0, 4]]);
        const oxide = new SmilesParser().parse("[O-]");
        expect(oxide.charges).toEqual([[0, -1]]);
        const iron = new SmilesParser().parse("[Fe+2]");
        expect(iron.charges).toEqual([[0, 2]]);
        const oxo = new SmilesParser().parse("[O-2]");
        expect(oxo.charges).toEqual([[0, -2]]);
        const chiral = new SmilesParser().parse("[C@@H](N)C(=O)O");
        expect(chiral.heavy[0]).toBe("C");
        expect(SmilesCheck.formula("[H][H]")).toBe("H2");
    });

    it("parses pyrrole style aromatic NH", () => {
        const parsed = new SmilesParser().parse("c1cc[nH]c1");
        expect(parsed.explicitH).toEqual([[3, 1]]);
        expect(SmilesCheck.formula("c1cc[nH]c1")).toBe("C4H5N");
    });

    it("parses two letter elements", () => {
        expect(SmilesCheck.formula("ClCCl")).toBe("CH2Cl2");
        expect(SmilesCheck.formula("CBr")).toBe("CH3Br");
        expect(SmilesCheck.formula("C[Si](C)(C)C")).toBe("C4H12Si");
    });

    it("parses E and Z slashes", () => {
        const trans = new SmilesParser().parse("C/C=C/C");
        expect(trans.bonds[1][3]).toBe("E");
        const cis = new SmilesParser().parse("C/C=C\\C");
        expect(cis.bonds[1][3]).toBe("Z");
    });

    it("parses stereochemistry on ring closures", () => {
        const open = new SmilesParser().parse("C/C1CC1");
        expect(open.bonds.length).toBe(4);
        const closed = new SmilesParser().parse("C1/C=C/C1");
        expect(closed.bonds.length).toBe(4);
    });

    it("parses percent ring closures", () => {
        const parsed = new SmilesParser().parse("C%10CC%10");
        expect(parsed.heavy.length).toBe(3);
        expect(parsed.bonds.length).toBe(3);
    });

    it("splits disconnected components", () => {
        const parsed = new SmilesParser().parse("CC.CC");
        expect(parsed.heavy.length).toBe(4);
        expect(parsed.bonds.length).toBe(2);
    });

    it("skips stray plus signs and unknown characters", () => {
        const plus = new SmilesParser().parse("C+C");
        expect(plus.bonds.length).toBe(0);
        const weird = new SmilesParser().parse("C$C");
        expect(weird.heavy.length).toBe(2);
    });

    it("tolerates unclosed brackets", () => {
        const parsed = new SmilesParser().parse("[C");
        expect(parsed.heavy).toEqual(["C"]);
    });

    it("parses real drug SMILES to published formulas", () => {
        expect(
            SmilesCheck.formula(
                "CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",
            ),
        ).toBe("C33H35FN2O5");
    });
});
