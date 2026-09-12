import type { CompactBond, ICompactMoleculeSpec, MoleculeCategory } from "./MoleculeRecord";
import { ElementRegistry } from "./ElementRegistry";
import { SmilesParser } from "./SmilesParser";

export class MoleculeCatalog {
    public static buildCompactSpecs(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [];
        specs.push(...MoleculeCatalog.buildAlkanes());
        specs.push(...MoleculeCatalog.buildAlkenes());
        specs.push(...MoleculeCatalog.buildAromatics());
        specs.push(...MoleculeCatalog.buildFunctional());
        specs.push(...MoleculeCatalog.buildAminoAcids());
        specs.push(...MoleculeCatalog.buildSugars());
        specs.push(...MoleculeCatalog.buildNucleotides());
        specs.push(...MoleculeCatalog.buildLipids());
        specs.push(...MoleculeCatalog.buildPharma());
        specs.push(...MoleculeCatalog.buildNeuro());
        specs.push(...MoleculeCatalog.buildPolymers());
        specs.push(...MoleculeCatalog.buildExplosives());
        specs.push(...MoleculeCatalog.buildToxins());
        specs.push(...MoleculeCatalog.buildExotic());
        specs.push(...MoleculeCatalog.buildBiomolecules());
        specs.push(...MoleculeCatalog.buildNatural());
        return specs;
    }

    private static make(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        category: MoleculeCategory,
        tags: string[],
        heavy: string[],
        bonds: CompactBond[],
        warn: boolean = false,
        inchi: string = "",
        charges: ReadonlyArray<readonly [number, number]> = [],
        explicitH: ReadonlyArray<readonly [number, number]> = [],
    ): ICompactMoleculeSpec {
        return {
            id,
            name,
            formula,
            smiles,
            category,
            tags,
            warn,
            inchi,
            heavy,
            bonds,
            charges,
            explicitH,
        };
    }

    private static chainBonds(n: number, order: number = 1): CompactBond[] {
        const bonds: CompactBond[] = [];
        for (let i = 0; i < n - 1; i++) {
            bonds.push([i, i + 1, order]);
        }
        return bonds;
    }

    private static ringBonds(n: number, order: number = 1): CompactBond[] {
        const bonds: CompactBond[] = MoleculeCatalog.chainBonds(n, order);
        bonds.push([n - 1, 0, order]);
        return bonds;
    }

    private static carbons(n: number): string[] {
        return new Array<string>(n).fill("C");
    }

    private static alkaneSmiles(n: number): string {
        return "C".repeat(n);
    }

    private static alkaneName(n: number): string {
        const names = [
            "Methane",
            "Ethane",
            "Propane",
            "Butane",
            "Pentane",
            "Hexane",
            "Heptane",
            "Octane",
            "Nonane",
            "Decane",
            "Undecane",
            "Dodecane",
            "Tridecane",
            "Tetradecane",
            "Pentadecane",
            "Hexadecane",
            "Heptadecane",
            "Octadecane",
            "Nonadecane",
            "Icosane",
        ];
        return names[n - 1];
    }

    private static alkaneFormula(n: number): string {
        return "C" + n + "H" + (2 * n + 2);
    }

    private static buildAlkanes(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [];
        for (let n = 1; n <= 20; n++) {
            specs.push(
                MoleculeCatalog.make(
                    "alkane-c" + n,
                    MoleculeCatalog.alkaneName(n),
                    MoleculeCatalog.alkaneFormula(n),
                    MoleculeCatalog.alkaneSmiles(n),
                    "alkanes",
                    n <= 4 ? ["gas", "fuel"] : ["fuel", "hydrocarbon"],
                    MoleculeCatalog.carbons(n),
                    MoleculeCatalog.chainBonds(n),
                ),
            );
        }
        specs.push(
            MoleculeCatalog.make(
                "isobutane",
                "Isobutane",
                "C4H10",
                "CC(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "isopentane",
                "Isopentane",
                "C5H12",
                "CCC(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "neopentane",
                "Neopentane",
                "C5H12",
                "CC(C)(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [0, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "2-methylpentane",
                "2-Methylpentane",
                "C6H14",
                "CCCC(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [3, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "3-methylpentane",
                "3-Methylpentane",
                "C6H14",
                "CCC(C)CC",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [2, 4, 1],
                    [3, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "2-2-dimethylbutane",
                "2,2-Dimethylbutane",
                "C6H14",
                "CCC(C)(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [1, 3, 1],
                    [1, 4, 1],
                    [2, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "2-3-dimethylbutane",
                "2,3-Dimethylbutane",
                "C6H14",
                "CC(C)C(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [1, 4, 1],
                    [2, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "isooctane",
                "Isooctane",
                "C8H18",
                "CC(C)CC(C)(C)C",
                "alkanes",
                ["fuel", "branched"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [1, 5, 1],
                    [3, 6, 1],
                    [3, 7, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cyclopropane",
                "Cyclopropane",
                "C3H6",
                "C1CC1",
                "alkanes",
                ["ring", "strained"],
                ["C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cyclobutane",
                "Cyclobutane",
                "C4H8",
                "C1CCC1",
                "alkanes",
                ["ring", "strained"],
                ["C", "C", "C", "C"],
                MoleculeCatalog.ringBonds(4),
            ),
            MoleculeCatalog.make(
                "cyclopentane",
                "Cyclopentane",
                "C5H10",
                "C1CCCC1",
                "alkanes",
                ["ring"],
                ["C", "C", "C", "C", "C"],
                MoleculeCatalog.ringBonds(5),
            ),
            MoleculeCatalog.make(
                "cyclohexane",
                "Cyclohexane",
                "C6H12",
                "C1CCCCC1",
                "alkanes",
                ["ring", "solvent"],
                ["C", "C", "C", "C", "C", "C"],
                MoleculeCatalog.ringBonds(6),
            ),
            MoleculeCatalog.make(
                "cyclooctane",
                "Cyclooctane",
                "C8H16",
                "C1CCCCCCC1",
                "alkanes",
                ["ring"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                MoleculeCatalog.ringBonds(8),
            ),
            MoleculeCatalog.make(
                "cubane",
                "Cubane",
                "C8H8",
                "C12C3C4C1C5C4C3C25",
                "alkanes",
                ["strained", "cage"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 0, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 4, 1],
                    [0, 4, 1],
                    [1, 5, 1],
                    [2, 6, 1],
                    [3, 7, 1],
                ],
            ),
            MoleculeCatalog.make(
                "adamantane",
                "Adamantane",
                "C10H16",
                "C1C2CC3CC1CC(C2)C3",
                "alkanes",
                ["cage", "diamondoid"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 4, 1],
                    [0, 5, 1],
                    [0, 6, 1],
                    [1, 4, 1],
                    [1, 7, 1],
                    [1, 8, 1],
                    [2, 5, 1],
                    [2, 7, 1],
                    [2, 9, 1],
                    [3, 6, 1],
                    [3, 8, 1],
                    [3, 9, 1],
                ],
            ),
        );
        return specs;
    }

    private static buildAlkenes(): ICompactMoleculeSpec[] {
        const c: (n: number) => string[] = (n) => MoleculeCatalog.carbons(n);
        return [
            MoleculeCatalog.make(
                "ethene",
                "Ethene",
                "C2H4",
                "C=C",
                "alkenes",
                ["gas", "monomer"],
                ["C", "C"],
                [[0, 1, 2]],
            ),
            MoleculeCatalog.make(
                "propene",
                "Propene",
                "C3H6",
                "CC=C",
                "alkenes",
                ["gas", "monomer"],
                ["C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                ],
            ),
            MoleculeCatalog.make(
                "1-butene",
                "1-Butene",
                "C4H8",
                "CCC=C",
                "alkenes",
                ["monomer"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                ],
            ),
            MoleculeCatalog.make(
                "cis-2-butene",
                "cis-2-Butene",
                "C4H8",
                "C/C=C\\C",
                "alkenes",
                ["stereo"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2, "Z"],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "trans-2-butene",
                "trans-2-Butene",
                "C4H8",
                "C/C=C/C",
                "alkenes",
                ["stereo"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2, "E"],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "isobutene",
                "Isobutene",
                "C4H8",
                "CC(=C)C",
                "alkenes",
                ["monomer"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "1-pentene",
                "1-Pentene",
                "C5H10",
                "CCCC=C",
                "alkenes",
                ["monomer"],
                c(5),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                ],
            ),
            MoleculeCatalog.make(
                "cis-2-pentene",
                "cis-2-Pentene",
                "C5H10",
                "CC/C=C\\C",
                "alkenes",
                ["stereo"],
                c(5),
                [
                    [0, 1, 1],
                    [1, 2, 2, "Z"],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "trans-2-pentene",
                "trans-2-Pentene",
                "C5H10",
                "CC/C=C/C",
                "alkenes",
                ["stereo"],
                c(5),
                [
                    [0, 1, 1],
                    [1, 2, 2, "E"],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "1-hexene",
                "1-Hexene",
                "C6H12",
                "CCCCC=C",
                "alkenes",
                ["monomer"],
                c(6),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 2],
                ],
            ),
            MoleculeCatalog.make(
                "1-octene",
                "1-Octene",
                "C8H16",
                "CCCCCCC=C",
                "alkenes",
                ["monomer"],
                c(8),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 2],
                ],
            ),
            MoleculeCatalog.make(
                "1-decene",
                "1-Decene",
                "C10H20",
                "CCCCCCCCC=C",
                "alkenes",
                ["monomer"],
                c(10),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 2],
                ],
            ),
            MoleculeCatalog.make(
                "butadiene",
                "1,3-Butadiene",
                "C4H6",
                "C=CC=C",
                "alkenes",
                ["monomer", "diene"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 2],
                ],
            ),
            MoleculeCatalog.make(
                "isoprene",
                "Isoprene",
                "C5H8",
                "CC(=C)C=C",
                "alkenes",
                ["monomer", "natural", "diene"],
                ["C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 2],
                ],
            ),
            MoleculeCatalog.make(
                "cyclopentene",
                "Cyclopentene",
                "C5H8",
                "C1CCC=C1",
                "alkenes",
                ["ring"],
                ["C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                    [3, 4, 1],
                    [4, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cyclohexene",
                "Cyclohexene",
                "C6H10",
                "C1CCCC=C1",
                "alkenes",
                ["ring"],
                c(6),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [4, 5, 1],
                    [5, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cyclopentadiene",
                "Cyclopentadiene",
                "C5H6",
                "C1C=CC=C1",
                "alkenes",
                ["ring", "diene"],
                ["C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [2, 3, 1],
                    [3, 4, 2],
                    [4, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "norbornene",
                "Norbornene",
                "C7H10",
                "C1CC2CC1C=C2",
                "alkenes",
                ["ring", "strained", "monomer"],
                ["C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [4, 5, 1],
                    [5, 0, 1],
                    [1, 6, 1],
                    [5, 6, 1],
                ],
            ),
            MoleculeCatalog.make(
                "styrene",
                "Styrene",
                "C8H8",
                "C=CCC1=CC=CC=C1",
                "alkenes",
                ["monomer", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                ],
            ),
            MoleculeCatalog.make(
                "vinyl-chloride",
                "Vinyl Chloride",
                "C2H3Cl",
                "C=CCl",
                "alkenes",
                ["monomer"],
                ["C", "C", "Cl"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acrylonitrile",
                "Acrylonitrile",
                "C3H3N",
                "C=CC#N",
                "alkenes",
                ["monomer"],
                ["C", "C", "C", "N"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 3],
                ],
            ),
            MoleculeCatalog.make(
                "methyl-methacrylate",
                "Methyl Methacrylate",
                "C5H8O2",
                "CC(=C)C(=O)OC",
                "alkenes",
                ["monomer"],
                ["C", "C", "C", "C", "O", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                    [5, 6, 1],
                ],
            ),
            MoleculeCatalog.make(
                "tetrafluoroethene",
                "Tetrafluoroethene",
                "C2F4",
                "FC(F)=C(F)F",
                "alkenes",
                ["monomer"],
                ["C", "C", "F", "F", "F", "F"],
                [
                    [0, 1, 2],
                    [0, 2, 1],
                    [0, 3, 1],
                    [1, 4, 1],
                    [1, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ethyne",
                "Ethyne",
                "C2H2",
                "C#C",
                "alkenes",
                ["gas", "alkyne"],
                ["C", "C"],
                [[0, 1, 3]],
            ),
            MoleculeCatalog.make(
                "propyne",
                "Propyne",
                "C3H4",
                "CC#C",
                "alkenes",
                ["gas", "alkyne"],
                ["C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 3],
                ],
            ),
            MoleculeCatalog.make(
                "1-butyne",
                "1-Butyne",
                "C4H6",
                "CCC#C",
                "alkenes",
                ["alkyne"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 3],
                ],
            ),
            MoleculeCatalog.make(
                "2-butyne",
                "2-Butyne",
                "C4H6",
                "CC#CC",
                "alkenes",
                ["alkyne"],
                ["C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 3],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "phenylacetylene",
                "Phenylacetylene",
                "C8H6",
                "C#CC1=CC=CC=C1",
                "alkenes",
                ["alkyne", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 3],
                    [1, 2, 1],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                ],
            ),
            MoleculeCatalog.make(
                "1-hexyne",
                "1-Hexyne",
                "C6H10",
                "CCCCC#C",
                "alkenes",
                ["alkyne"],
                c(6),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 3],
                ],
            ),
            MoleculeCatalog.make(
                "3-hexyne",
                "3-Hexyne",
                "C6H10",
                "CCC#CCC",
                "alkenes",
                ["alkyne"],
                c(6),
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 3],
                    [3, 4, 1],
                    [4, 5, 1],
                ],
            ),
        ];
    }

    private static phenyl(
        start: number,
        attach: number,
    ): { heavy: string[]; bonds: CompactBond[]; ring: number[] } {
        const ring = [start, start + 1, start + 2, start + 3, start + 4, start + 5];
        const bonds: CompactBond[] = [
            [ring[0], ring[1], 4],
            [ring[1], ring[2], 4],
            [ring[2], ring[3], 4],
            [ring[3], ring[4], 4],
            [ring[4], ring[5], 4],
            [ring[5], ring[0], 4],
        ];
        if (attach >= 0) {
            bonds.push([attach, ring[0], 1]);
        }
        return { heavy: ["C", "C", "C", "C", "C", "C"], bonds, ring };
    }

    private static buildAromatics(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [];
        const p = (s: number): { heavy: string[]; bonds: CompactBond[]; ring: number[] } =>
            MoleculeCatalog.phenyl(s, -1);
        specs.push(
            MoleculeCatalog.make(
                "benzene",
                "Benzene",
                "C6H6",
                "C1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                p(0).heavy,
                p(0).bonds,
                false,
                "InChI=1S/C6H6/c1-2-4-6-5-3-1/h1-6H",
            ),
        );
        const methylOn = (
            id: string,
            name: string,
            formula: string,
            smiles: string,
            pos: number,
        ): ICompactMoleculeSpec => {
            const ph = MoleculeCatalog.phenyl(1, -1);
            const heavy = ["C", ...ph.heavy];
            const bonds: CompactBond[] = [...ph.bonds, [0, pos, 1]];
            return MoleculeCatalog.make(
                id,
                name,
                formula,
                smiles,
                "aromatics",
                ["aromatic"],
                heavy,
                bonds,
            );
        };
        specs.push(
            methylOn("toluene", "Toluene", "C7H8", "CC1=CC=CC=C1", 1),
            MoleculeCatalog.make(
                "ethylbenzene",
                "Ethylbenzene",
                "C8H10",
                "CCC1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "o-xylene",
                "o-Xylene",
                "C8H10",
                "CC1=CC=CC=C1C",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    ...MoleculeCatalog.phenyl(2, -1).bonds.map(
                        (b) => [b[0], b[1], b[2]] as CompactBond,
                    ),
                    [0, 2, 1],
                    [1, 3, 1],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "m-xylene",
                "m-Xylene",
                "C8H10",
                "CC1=CC(=CC=C1)C",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [0, 2, 1],
                    [1, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "p-xylene",
                "p-Xylene",
                "C8H10",
                "CC1=CC=C(C=C1)C",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [0, 2, 1],
                    [1, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cumene",
                "Cumene",
                "C9H12",
                "CC(C)C1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [2, 3, 1],
                    [2, 0, 1],
                    [2, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "mesitylene",
                "Mesitylene",
                "C9H12",
                "CC1=CC(=CC(=C1)C)C",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [0, 3, 1],
                    [1, 5, 1],
                    [2, 7, 1],
                ],
            ),
            MoleculeCatalog.make(
                "phenol",
                "Phenol",
                "C6H6O",
                "OC1=CC=CC=C1",
                "aromatics",
                ["aromatic", "acid"],
                ["O", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "o-cresol",
                "o-Cresol",
                "C7H8O",
                "CC1=CC=CC=C1O",
                "aromatics",
                ["aromatic"],
                ["C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [0, 2, 1],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "m-cresol",
                "m-Cresol",
                "C7H8O",
                "CC1=CC(=CC=C1)O",
                "aromatics",
                ["aromatic"],
                ["C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [0, 2, 1],
                    [1, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "p-cresol",
                "p-Cresol",
                "C7H8O",
                "CC1=CC=C(C=C1)O",
                "aromatics",
                ["aromatic"],
                ["C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [0, 2, 1],
                    [1, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "anisole",
                "Anisole",
                "C7H8O",
                "COC1=CC=CC=C1",
                "aromatics",
                ["aromatic", "ether"],
                ["C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [1, 2, 1],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "aniline",
                "Aniline",
                "C6H7N",
                "NC1=CC=CC=C1",
                "aromatics",
                ["aromatic", "base"],
                ["N", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "nitrobenzene",
                "Nitrobenzene",
                "C6H5NO2",
                "O=[N+]([O-])C1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["N", "O", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [0, 3, 1],
                    [0, 1, 2],
                    [0, 2, 1],
                ],
                false,
                "",
                [
                    [0, 1],
                    [2, -1],
                ],
            ),
            MoleculeCatalog.make(
                "fluorobenzene",
                "Fluorobenzene",
                "C6H5F",
                "FC1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["F", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "chlorobenzene",
                "Chlorobenzene",
                "C6H5Cl",
                "ClC1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["Cl", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "bromobenzene",
                "Bromobenzene",
                "C6H5Br",
                "BrC1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["Br", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "iodobenzene",
                "Iodobenzene",
                "C6H5I",
                "IC1=CC=CC=C1",
                "aromatics",
                ["aromatic"],
                ["I", "C", "C", "C", "C", "C", "C"],
                [
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [0, 1, 1],
                ],
            ),
            MoleculeCatalog.make(
                "benzoic-acid",
                "Benzoic Acid",
                "C7H6O2",
                "OC(=O)C1=CC=CC=C1",
                "aromatics",
                ["aromatic", "acid"],
                ["O", "C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [1, 3, 1],
                    [1, 2, 2],
                    [1, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "benzaldehyde",
                "Benzaldehyde",
                "C7H6O",
                "O=CC1=CC=CC=C1",
                "aromatics",
                ["aromatic", "aldehyde"],
                ["O", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 2, 4],
                    [1, 2, 1],
                    [1, 0, 2],
                ],
            ),
            MoleculeCatalog.make(
                "acetophenone",
                "Acetophenone",
                "C8H8O",
                "CC(=O)C1=CC=CC=C1",
                "aromatics",
                ["aromatic", "ketone"],
                ["C", "C", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [1, 3, 1],
                    [1, 2, 2],
                    [1, 0, 1],
                ],
            ),
            MoleculeCatalog.make(
                "salicylic-acid",
                "Salicylic Acid",
                "C7H6O3",
                "OC(=O)C1=CC=CC=C1O",
                "aromatics",
                ["aromatic", "acid", "natural"],
                ["O", "C", "O", "C", "C", "C", "C", "C", "C", "O"],
                [
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 3, 4],
                    [1, 3, 1],
                    [1, 2, 2],
                    [1, 0, 1],
                    [9, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "aspirin",
                "Aspirin",
                "C9H8O4",
                "CC(=O)OC1=CC=CC=C1C(=O)O",
                "pharma",
                ["drug", "aromatic", "acid"],
                ["C", "C", "O", "O", "C", "C", "C", "C", "C", "C", "C", "O", "O"],
                [
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 4, 4],
                    [1, 0, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 1],
                    [10, 9, 1],
                    [10, 11, 2],
                    [10, 12, 1],
                ],
            ),
            MoleculeCatalog.make(
                "naphthalene",
                "Naphthalene",
                "C10H8",
                "C1=CC=C2C=CC=CC2=C1",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(10),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 0, 4],
                    [4, 9, 4],
                ],
            ),
            MoleculeCatalog.make(
                "anthracene",
                "Anthracene",
                "C14H10",
                "C1=CC=C2C=C3C=CC=CC3=CC2=C1",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(14),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [2, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 3, 4],
                    [7, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 13, 4],
                    [13, 8, 4],
                ],
            ),
            MoleculeCatalog.make(
                "phenanthrene",
                "Phenanthrene",
                "C14H10",
                "C1=CC=C2C(=C1)C=CC3=CC=CC=C32",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(14),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [2, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 3, 4],
                    [6, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 13, 4],
                    [13, 7, 4],
                ],
            ),
            MoleculeCatalog.make(
                "pyrene",
                "Pyrene",
                "C16H10",
                "C1=CC2=C3C(=C1)C=CC4=CC=CC(=C43)C=C2",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(16),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 14, 4],
                    [14, 15, 4],
                    [12, 13, 4],
                    [13, 0, 4],
                    [14, 2, 4],
                    [15, 5, 4],
                    [15, 9, 4],
                ],
            ),
            MoleculeCatalog.make(
                "chrysene",
                "Chrysene",
                "C18H12",
                "C1=CC=C2C(=C1)C=CC3=C2C=CC4=CC=CC=C43",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(18),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [2, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 3, 4],
                    [6, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 13, 4],
                    [13, 7, 4],
                    [11, 14, 4],
                    [14, 15, 4],
                    [15, 16, 4],
                    [16, 17, 4],
                    [17, 12, 4],
                ],
            ),
            MoleculeCatalog.make(
                "azulene",
                "Azulene",
                "C10H8",
                "C1=CC2=CC=CC=CC2=C1",
                "aromatics",
                ["aromatic"],
                MoleculeCatalog.carbons(10),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                    [2, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 3, 4],
                ],
            ),
            MoleculeCatalog.make(
                "biphenyl",
                "Biphenyl",
                "C12H10",
                "C1=CC=C(C=C1)C2=CC=CC=C2",
                "aromatics",
                ["aromatic"],
                MoleculeCatalog.carbons(12),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 6, 4],
                    [0, 6, 1],
                ],
            ),
            MoleculeCatalog.make(
                "fluorene",
                "Fluorene",
                "C13H10",
                "C1=CC=C2C(=C1)CC3=CC=CC=C32",
                "aromatics",
                ["aromatic"],
                MoleculeCatalog.carbons(13),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 6, 4],
                    [0, 6, 1],
                    [5, 12, 1],
                    [11, 12, 1],
                ],
            ),
            MoleculeCatalog.make(
                "pyridine",
                "Pyridine",
                "C5H5N",
                "C1=CC=NC=C1",
                "aromatics",
                ["aromatic", "base"],
                ["C", "C", "C", "N", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                ],
            ),
            MoleculeCatalog.make(
                "pyrimidine",
                "Pyrimidine",
                "C4H4N2",
                "C1=CN=CN=C1",
                "aromatics",
                ["aromatic", "base"],
                ["C", "C", "N", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                ],
            ),
            MoleculeCatalog.make(
                "pyrazine",
                "Pyrazine",
                "C4H4N2",
                "C1=CN=CC=N1",
                "aromatics",
                ["aromatic"],
                ["C", "N", "C", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                ],
            ),
            MoleculeCatalog.make(
                "pyrrole",
                "Pyrrole",
                "C4H5N",
                "C1=CC=CN1",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                ],
                false,
                "",
                [],
                [[4, 1]],
            ),
            MoleculeCatalog.make(
                "imidazole",
                "Imidazole",
                "C3H4N2",
                "C1=CN=CN1",
                "aromatics",
                ["aromatic", "base"],
                ["C", "N", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                ],
                false,
                "",
                [],
                [[1, 1]],
            ),
            MoleculeCatalog.make(
                "furan",
                "Furan",
                "C4H4O",
                "C1=CC=CO1",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                ],
            ),
            MoleculeCatalog.make(
                "thiophene",
                "Thiophene",
                "C4H4S",
                "C1=CC=CS1",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "S"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                ],
            ),
            MoleculeCatalog.make(
                "indole",
                "Indole",
                "C8H7N",
                "C1=CC=C2C(=C1)C=CN2",
                "aromatics",
                ["aromatic", "natural"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 5, 4],
                ],
                false,
                "",
                [],
                [[8, 1]],
            ),
            MoleculeCatalog.make(
                "quinoline",
                "Quinoline",
                "C9H7N",
                "C1=CC=C2C(=C1)C=CC=N2",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 5, 4],
                ],
            ),
            MoleculeCatalog.make(
                "purine",
                "Purine",
                "C5H4N4",
                "C1=NC=NC2=C1N=CN2",
                "aromatics",
                ["aromatic", "base"],
                ["C", "N", "C", "N", "C", "C", "N", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 5, 4],
                ],
                false,
                "",
                [],
                [[8, 1]],
            ),
            MoleculeCatalog.make(
                "carbazole",
                "Carbazole",
                "C12H9N",
                "C1=CC=C2C(=C1)C3=CC=CC=C3N2",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 6, 4],
                    [4, 10, 4],
                    [5, 11, 4],
                    [11, 12, 4],
                    [10, 12, 4],
                ],
                false,
                "",
                [],
                [[12, 1]],
            ),
            MoleculeCatalog.make(
                "coronene",
                "Coronene",
                "C24H12",
                "c1cc2ccc3ccc4ccc5ccc6ccc1c1c2c3c4c5c61",
                "aromatics",
                ["aromatic", "pah"],
                MoleculeCatalog.carbons(24),
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 4],
                    [6, 12, 4],
                    [12, 18, 4],
                    [18, 7, 4],
                    [7, 1, 4],
                    [7, 13, 4],
                    [13, 19, 4],
                    [19, 8, 4],
                    [8, 2, 4],
                    [8, 14, 4],
                    [14, 20, 4],
                    [20, 9, 4],
                    [9, 3, 4],
                    [9, 15, 4],
                    [15, 21, 4],
                    [21, 10, 4],
                    [10, 4, 4],
                    [10, 16, 4],
                    [16, 22, 4],
                    [22, 11, 4],
                    [11, 5, 4],
                    [11, 17, 4],
                    [17, 23, 4],
                    [23, 6, 4],
                ],
            ),
            MoleculeCatalog.make(
                "durene",
                "Durene",
                "C10H14",
                "CC1=CC(=C(C=C1C)C)C",
                "aromatics",
                ["aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [3, 8, 1],
                    [4, 9, 1],
                ],
            ),
            MoleculeCatalog.make(
                "p-cymene",
                "p-Cymene",
                "C10H14",
                "CC(C)C1=CC=C(C)C=C1",
                "aromatics",
                ["aromatic", "natural"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [6, 7, 1],
                    [6, 8, 1],
                    [3, 9, 1],
                ],
            ),
        );
        return specs;
    }

    private static buildFunctional(): ICompactMoleculeSpec[] {
        return [
            MoleculeCatalog.make(
                "methanol",
                "Methanol",
                "CH4O",
                "CO",
                "functional",
                ["solvent"],
                ["C", "O"],
                [[0, 1, 1]],
            ),
            MoleculeCatalog.make(
                "ethanol",
                "Ethanol",
                "C2H6O",
                "CCO",
                "functional",
                ["solvent"],
                ["C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "1-propanol",
                "1-Propanol",
                "C3H8O",
                "CCCO",
                "functional",
                ["solvent"],
                ["C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "2-propanol",
                "2-Propanol",
                "C3H8O",
                "CC(C)O",
                "functional",
                ["solvent"],
                ["C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "1-butanol",
                "1-Butanol",
                "C4H10O",
                "CCCCO",
                "functional",
                ["solvent"],
                ["C", "C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "tert-butanol",
                "tert-Butanol",
                "C4H10O",
                "CC(C)(C)O",
                "functional",
                ["solvent"],
                ["C", "C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [0, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ethylene-glycol",
                "Ethylene Glycol",
                "C2H6O2",
                "OCCO",
                "functional",
                ["solvent"],
                ["O", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "glycerol",
                "Glycerol",
                "C3H8O3",
                "OCC(O)CO",
                "functional",
                ["natural"],
                ["C", "C", "C", "O", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [0, 3, 1],
                    [1, 4, 1],
                    [2, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "dimethyl-ether",
                "Dimethyl Ether",
                "C2H6O",
                "COC",
                "functional",
                ["solvent", "gas"],
                ["C", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "diethyl-ether",
                "Diethyl Ether",
                "C4H10O",
                "CCOCC",
                "functional",
                ["solvent"],
                ["C", "C", "O", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "mtbe",
                "MTBE",
                "C5H12O",
                "COC(C)(C)C",
                "functional",
                ["fuel"],
                ["C", "C", "C", "C", "O", "C"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [0, 4, 1],
                    [4, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "thf",
                "THF",
                "C4H8O",
                "C1CCOC1",
                "functional",
                ["solvent", "ring"],
                ["O", "C", "C", "C", "C"],
                MoleculeCatalog.ringBonds(5),
            ),
            MoleculeCatalog.make(
                "dioxane",
                "1,4-Dioxane",
                "C4H8O2",
                "C1COCCO1",
                "functional",
                ["solvent", "ring"],
                ["O", "C", "C", "O", "C", "C"],
                MoleculeCatalog.ringBonds(6),
            ),
            MoleculeCatalog.make(
                "18-crown-6",
                "18-Crown-6",
                "C12H24O6",
                "C1COCCOCCOCCOCCOCCO1",
                "functional",
                ["ring"],
                [
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                ],
                MoleculeCatalog.ringBonds(18),
            ),
            MoleculeCatalog.make(
                "formaldehyde",
                "Formaldehyde",
                "CH2O",
                "C=O",
                "functional",
                ["aldehyde"],
                ["C", "O"],
                [[0, 1, 2]],
            ),
            MoleculeCatalog.make(
                "acetaldehyde",
                "Acetaldehyde",
                "C2H4O",
                "CC=O",
                "functional",
                ["aldehyde"],
                ["C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                ],
            ),
            MoleculeCatalog.make(
                "propanal",
                "Propanal",
                "C3H6O",
                "CCC=O",
                "functional",
                ["aldehyde"],
                ["C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                ],
            ),
            MoleculeCatalog.make(
                "butanal",
                "Butanal",
                "C4H8O",
                "CCCC=O",
                "functional",
                ["aldehyde"],
                ["C", "C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                ],
            ),
            MoleculeCatalog.make(
                "glutaraldehyde",
                "Glutaraldehyde",
                "C5H8O2",
                "O=CCCCC=O",
                "functional",
                ["aldehyde"],
                ["O", "C", "C", "C", "C", "C", "O"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 2],
                ],
            ),
            MoleculeCatalog.make(
                "acetone",
                "Acetone",
                "C3H6O",
                "CC(C)=O",
                "functional",
                ["solvent", "ketone"],
                ["C", "C", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "butanone",
                "Butanone",
                "C4H8O",
                "CCC(C)=O",
                "functional",
                ["solvent", "ketone"],
                ["C", "C", "C", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "3-pentanone",
                "3-Pentanone",
                "C5H10O",
                "CCC(=O)CC",
                "functional",
                ["ketone"],
                ["C", "C", "C", "O", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                    [2, 4, 1],
                    [4, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cyclohexanone",
                "Cyclohexanone",
                "C6H10O",
                "O=C1CCCCC1",
                "functional",
                ["ketone", "ring"],
                ["C", "C", "C", "C", "C", "C", "O"],
                [...MoleculeCatalog.ringBonds(6), [5, 6, 2]],
            ),
            MoleculeCatalog.make(
                "biacetyl",
                "Biacetyl",
                "C4H6O2",
                "CC(=O)C(C)=O",
                "functional",
                ["ketone", "natural"],
                ["C", "C", "O", "C", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "formic-acid",
                "Formic Acid",
                "CH2O2",
                "OC=O",
                "functional",
                ["acid"],
                ["C", "O", "O"],
                [
                    [0, 1, 2],
                    [0, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acetic-acid",
                "Acetic Acid",
                "C2H4O2",
                "CC(O)=O",
                "functional",
                ["acid"],
                ["C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "propionic-acid",
                "Propionic Acid",
                "C3H6O2",
                "CCC(O)=O",
                "functional",
                ["acid"],
                ["C", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "butyric-acid",
                "Butyric Acid",
                "C4H8O2",
                "CCCC(O)=O",
                "functional",
                ["acid"],
                ["C", "C", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "oxalic-acid",
                "Oxalic Acid",
                "C2H2O4",
                "OC(=O)C(O)=O",
                "functional",
                ["acid"],
                ["O", "C", "C", "O", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [1, 5, 2],
                    [2, 3, 2],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acrylic-acid",
                "Acrylic Acid",
                "C3H4O2",
                "C=CC(O)=O",
                "functional",
                ["acid", "monomer"],
                ["C", "C", "C", "O", "O"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 2],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "citric-acid",
                "Citric Acid",
                "C6H8O7",
                "OC(=O)CC(O)(CC(O)=O)C(O)=O",
                "functional",
                ["acid", "natural"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "O", "O", "O", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [2, 5, 1],
                    [0, 6, 2],
                    [0, 7, 1],
                    [4, 8, 2],
                    [4, 9, 1],
                    [5, 10, 2],
                    [5, 11, 1],
                    [2, 12, 1],
                ],
            ),
            MoleculeCatalog.make(
                "methyl-acetate",
                "Methyl Acetate",
                "C3H6O2",
                "COC(C)=O",
                "functional",
                ["solvent"],
                ["C", "C", "O", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ethyl-acetate",
                "Ethyl Acetate",
                "C4H8O2",
                "CCOC(C)=O",
                "functional",
                ["solvent"],
                ["C", "C", "O", "O", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "vinyl-acetate",
                "Vinyl Acetate",
                "C4H6O2",
                "C=COC(C)=O",
                "functional",
                ["monomer"],
                ["C", "C", "O", "C", "O", "C"],
                [
                    [0, 1, 2],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ethyl-formate",
                "Ethyl Formate",
                "C3H6O2",
                "CCOC=O",
                "functional",
                [],
                ["C", "O", "O", "C", "C"],
                [
                    [0, 1, 2],
                    [0, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "methylamine",
                "Methylamine",
                "CH5N",
                "CN",
                "functional",
                ["base", "gas"],
                ["C", "N"],
                [[0, 1, 1]],
            ),
            MoleculeCatalog.make(
                "ethylamine",
                "Ethylamine",
                "C2H7N",
                "CCN",
                "functional",
                ["base"],
                ["C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "dimethylamine",
                "Dimethylamine",
                "C2H7N",
                "CNC",
                "functional",
                ["base"],
                ["C", "N", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "trimethylamine",
                "Trimethylamine",
                "C3H9N",
                "CN(C)C",
                "functional",
                ["base"],
                ["C", "N", "C", "C"],
                [
                    [1, 0, 1],
                    [1, 2, 1],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "diethylamine",
                "Diethylamine",
                "C4H11N",
                "CCNCC",
                "functional",
                ["base"],
                ["C", "C", "N", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ethylenediamine",
                "Ethylenediamine",
                "C2H8N2",
                "NCCN",
                "functional",
                ["base"],
                ["N", "C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "formamide",
                "Formamide",
                "CH3NO",
                "NC=O",
                "functional",
                ["solvent"],
                ["C", "O", "N"],
                [
                    [0, 1, 2],
                    [0, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acetamide",
                "Acetamide",
                "C2H5NO",
                "CC(N)=O",
                "functional",
                [],
                ["C", "C", "O", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "dmf",
                "DMF",
                "C3H7NO",
                "CN(C)C=O",
                "functional",
                ["solvent"],
                ["C", "N", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [1, 3, 1],
                    [3, 4, 2],
                ],
            ),
            MoleculeCatalog.make(
                "urea",
                "Urea",
                "CH4N2O",
                "NC(N)=O",
                "functional",
                ["biomolecule"],
                ["N", "C", "O", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acetonitrile",
                "Acetonitrile",
                "C2H3N",
                "CC#N",
                "functional",
                ["solvent"],
                ["C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 3],
                ],
            ),
            MoleculeCatalog.make(
                "propionitrile",
                "Propionitrile",
                "C3H5N",
                "CCC#N",
                "functional",
                [],
                ["C", "C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 3],
                ],
            ),
            MoleculeCatalog.make(
                "malononitrile",
                "Malononitrile",
                "C3H2N2",
                "N#CCC#N",
                "functional",
                [],
                ["N", "C", "C", "C", "N"],
                [
                    [0, 1, 3],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 3],
                ],
            ),
            MoleculeCatalog.make(
                "chloromethane",
                "Chloromethane",
                "CH3Cl",
                "CCl",
                "functional",
                ["gas"],
                ["C", "Cl"],
                [[0, 1, 1]],
            ),
            MoleculeCatalog.make(
                "chloroform",
                "Chloroform",
                "CHCl3",
                "ClC(Cl)Cl",
                "functional",
                ["solvent"],
                ["C", "Cl", "Cl", "Cl"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cfc-12",
                "CFC-12",
                "CCl2F2",
                "ClC(Cl)(F)F",
                "functional",
                ["gas"],
                ["C", "Cl", "Cl", "F", "F"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [0, 4, 1],
                ],
            ),
            MoleculeCatalog.make(
                "bromoethane",
                "Bromoethane",
                "C2H5Br",
                "CCBr",
                "functional",
                [],
                ["C", "C", "Br"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "iodomethane",
                "Iodomethane",
                "CH3I",
                "CI",
                "functional",
                [],
                ["C", "I"],
                [[0, 1, 1]],
            ),
            MoleculeCatalog.make(
                "methanethiol",
                "Methanethiol",
                "CH4S",
                "CS",
                "functional",
                ["gas"],
                ["C", "S"],
                [[0, 1, 1]],
            ),
            MoleculeCatalog.make(
                "dimethyl-sulfide",
                "Dimethyl Sulfide",
                "C2H6S",
                "CSC",
                "functional",
                ["natural"],
                ["C", "S", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                ],
            ),
            MoleculeCatalog.make(
                "dmso",
                "DMSO",
                "C2H6OS",
                "CS(C)=O",
                "functional",
                ["solvent"],
                ["C", "S", "O", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                ],
            ),
            MoleculeCatalog.make(
                "sulfolane",
                "Sulfolane",
                "C4H8O2S",
                "O=S1(=O)CCCC1",
                "functional",
                ["solvent", "ring"],
                ["S", "C", "C", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 0, 1],
                    [0, 5, 2],
                    [0, 6, 2],
                ],
            ),
        ];
    }

    private static residueSide(code: string): {
        heavy: string[];
        bonds: CompactBond[];
        extraH: number[];
    } {
        switch (code) {
            case "A":
                return { heavy: ["C"], bonds: [[-1, 0, 1]], extraH: [] };
            case "V":
                return {
                    heavy: ["C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [0, 2, 1],
                    ],
                    extraH: [],
                };
            case "L":
                return {
                    heavy: ["C", "C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [1, 3, 1],
                    ],
                    extraH: [],
                };
            case "I":
                return {
                    heavy: ["C", "C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [0, 2, 1],
                        [2, 3, 1],
                    ],
                    extraH: [],
                };
            case "S":
                return {
                    heavy: ["C", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                    ],
                    extraH: [],
                };
            case "T":
                return {
                    heavy: ["C", "C", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [0, 2, 1],
                    ],
                    extraH: [],
                };
            case "C":
                return {
                    heavy: ["C", "S"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                    ],
                    extraH: [],
                };
            case "M":
                return {
                    heavy: ["C", "C", "S", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 1],
                    ],
                    extraH: [],
                };
            case "D":
                return {
                    heavy: ["C", "C", "O", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 2],
                        [1, 3, 1],
                    ],
                    extraH: [],
                };
            case "E":
                return {
                    heavy: ["C", "C", "C", "O", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 2],
                        [2, 4, 1],
                    ],
                    extraH: [],
                };
            case "N":
                return {
                    heavy: ["C", "C", "O", "N"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 2],
                        [1, 3, 1],
                    ],
                    extraH: [],
                };
            case "Q":
                return {
                    heavy: ["C", "C", "C", "O", "N"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 2],
                        [2, 4, 1],
                    ],
                    extraH: [],
                };
            case "K":
                return {
                    heavy: ["C", "C", "C", "C", "N"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 1],
                        [3, 4, 1],
                    ],
                    extraH: [],
                };
            case "R":
                return {
                    heavy: ["C", "C", "C", "N", "C", "N", "N"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 1],
                        [3, 4, 1],
                        [4, 5, 2],
                        [4, 6, 1],
                    ],
                    extraH: [],
                };
            case "H":
                return {
                    heavy: ["C", "C", "N", "C", "N", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 4],
                        [2, 3, 4],
                        [3, 4, 4],
                        [4, 5, 4],
                        [5, 1, 4],
                    ],
                    extraH: [2],
                };
            case "F":
                return {
                    heavy: ["C", "C", "C", "C", "C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 4],
                        [2, 3, 4],
                        [3, 4, 4],
                        [4, 5, 4],
                        [5, 6, 4],
                        [6, 1, 4],
                    ],
                    extraH: [],
                };
            case "Y":
                return {
                    heavy: ["C", "C", "C", "C", "C", "C", "C", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 4],
                        [2, 3, 4],
                        [3, 4, 4],
                        [4, 5, 4],
                        [5, 6, 4],
                        [6, 1, 4],
                        [4, 7, 1],
                    ],
                    extraH: [],
                };
            case "W":
                return {
                    heavy: ["C", "C", "C", "C", "C", "C", "C", "C", "C", "N"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 7, 1],
                        [1, 2, 4],
                        [2, 3, 4],
                        [3, 4, 4],
                        [4, 5, 4],
                        [5, 6, 4],
                        [6, 1, 4],
                        [6, 7, 4],
                        [7, 8, 4],
                        [8, 9, 4],
                        [9, 1, 4],
                    ],
                    extraH: [9],
                };
            case "P":
                return {
                    heavy: ["C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, -2, 1],
                    ],
                    extraH: [],
                };
            case "U":
                return {
                    heavy: ["C", "Se"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                    ],
                    extraH: [],
                };
            case "J":
                return {
                    heavy: ["C", "C", "C", "O"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, -2, 1],
                        [1, 3, 1],
                    ],
                    extraH: [],
                };
            case "O":
                return {
                    heavy: ["C", "C", "C", "C", "N", "C", "O", "N", "C", "C", "C", "C", "C"],
                    bonds: [
                        [-1, 0, 1],
                        [0, 1, 1],
                        [1, 2, 1],
                        [2, 3, 1],
                        [3, 4, 1],
                        [4, 5, 1],
                        [5, 6, 2],
                        [5, 7, 1],
                        [7, 8, 1],
                        [8, 9, 1],
                        [9, 10, 1],
                        [10, 11, 2],
                        [11, 7, 1],
                        [8, 12, 1],
                    ],
                    extraH: [],
                };
            default:
                return { heavy: [], bonds: [], extraH: [] };
        }
    }

    private static stampAminoAcid(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        code: string,
        extraBonds: CompactBond[] = [],
        extraHeavy: string[] = [],
        extraH: Array<readonly [number, number]> = [],
    ): ICompactMoleculeSpec {
        const backbone: string[] = ["N", "C", "C", "O", "O"];
        const backboneBonds: CompactBond[] = [
            [0, 1, 1],
            [1, 2, 1],
            [2, 3, 2],
            [2, 4, 1],
        ];
        const side = MoleculeCatalog.residueSide(code);
        const heavy: string[] = [...backbone, ...side.heavy, ...extraHeavy];
        const bonds: CompactBond[] = [...backboneBonds];
        for (const b of side.bonds) {
            const a = b[0] === -1 ? 1 : b[0] === -2 ? 0 : b[0] + 5;
            const c = b[1] === -1 ? 1 : b[1] === -2 ? 0 : b[1] + 5;
            bonds.push([a, c, b[2]]);
        }
        bonds.push(...extraBonds);
        const shiftedH: Array<readonly [number, number]> = side.extraH.map(
            (i) => [i + 5, 1] as const,
        );
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            "amino",
            ["amino", "biomolecule"],
            heavy,
            bonds,
            false,
            "",
            [],
            [...shiftedH, ...extraH],
        );
    }

    private static buildAminoAcids(): ICompactMoleculeSpec[] {
        return [
            MoleculeCatalog.make(
                "glycine",
                "Glycine",
                "C2H5NO2",
                "NCC(=O)O",
                "amino",
                ["amino", "biomolecule"],
                ["N", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 2],
                    [2, 4, 1],
                ],
            ),
            MoleculeCatalog.stampAminoAcid("alanine", "Alanine", "C3H7NO2", "CC(N)C(O)=O", "A"),
            MoleculeCatalog.stampAminoAcid("valine", "Valine", "C5H11NO2", "CC(C)C(N)C(O)=O", "V"),
            MoleculeCatalog.stampAminoAcid(
                "leucine",
                "Leucine",
                "C6H13NO2",
                "CC(C)CC(N)C(O)=O",
                "L",
            ),
            MoleculeCatalog.stampAminoAcid(
                "isoleucine",
                "Isoleucine",
                "C6H13NO2",
                "CCC(C)C(N)C(O)=O",
                "I",
            ),
            MoleculeCatalog.stampAminoAcid("serine", "Serine", "C3H7NO3", "NC(CO)C(O)=O", "S"),
            MoleculeCatalog.stampAminoAcid(
                "threonine",
                "Threonine",
                "C4H9NO3",
                "CC(O)C(N)C(O)=O",
                "T",
            ),
            MoleculeCatalog.stampAminoAcid("cysteine", "Cysteine", "C3H7NO2S", "NC(CS)C(O)=O", "C"),
            MoleculeCatalog.stampAminoAcid(
                "methionine",
                "Methionine",
                "C5H11NO2S",
                "CSCCC(N)C(O)=O",
                "M",
            ),
            MoleculeCatalog.stampAminoAcid(
                "aspartate",
                "Aspartate",
                "C4H7NO4",
                "NC(CC(O)=O)C(O)=O",
                "D",
            ),
            MoleculeCatalog.stampAminoAcid(
                "glutamate",
                "Glutamate",
                "C5H9NO4",
                "NC(CCC(O)=O)C(O)=O",
                "E",
            ),
            MoleculeCatalog.stampAminoAcid(
                "asparagine",
                "Asparagine",
                "C4H8N2O3",
                "NC(CC(N)=O)C(O)=O",
                "N",
            ),
            MoleculeCatalog.stampAminoAcid(
                "glutamine",
                "Glutamine",
                "C5H10N2O3",
                "NC(CCC(N)=O)C(O)=O",
                "Q",
            ),
            MoleculeCatalog.stampAminoAcid("lysine", "Lysine", "C6H14N2O2", "NCCCCC(N)C(O)=O", "K"),
            MoleculeCatalog.stampAminoAcid(
                "arginine",
                "Arginine",
                "C6H14N4O2",
                "NC(CCCNC(N)=N)C(O)=O",
                "R",
            ),
            MoleculeCatalog.stampAminoAcid(
                "histidine",
                "Histidine",
                "C6H9N3O2",
                "NC(CC1=CN=CN1)C(O)=O",
                "H",
            ),
            MoleculeCatalog.stampAminoAcid(
                "phenylalanine",
                "Phenylalanine",
                "C9H11NO2",
                "NC(CC1=CC=CC=C1)C(O)=O",
                "F",
            ),
            MoleculeCatalog.stampAminoAcid(
                "tyrosine",
                "Tyrosine",
                "C9H11NO3",
                "NC(CC1=CC=C(O)C=C1)C(O)=O",
                "Y",
            ),
            MoleculeCatalog.stampAminoAcid(
                "tryptophan",
                "Tryptophan",
                "C11H12N2O2",
                "NC(CC1=CNC2=CC=CC=C12)C(O)=O",
                "W",
            ),
            MoleculeCatalog.stampAminoAcid("proline", "Proline", "C5H9NO2", "C1CC(NC1)C(O)=O", "P"),
            MoleculeCatalog.stampAminoAcid(
                "selenocysteine",
                "Selenocysteine",
                "C3H7NO2Se",
                "NC(C[SeH])C(O)=O",
                "U",
            ),
            MoleculeCatalog.stampAminoAcid(
                "pyrrolysine",
                "Pyrrolysine",
                "C12H21N3O3",
                "CC1CCC(N1C(=O)CCCCC(N)C(O)=O)",
                "O",
            ),
            MoleculeCatalog.make(
                "gaba",
                "GABA",
                "C4H9NO2",
                "NCCCC(O)=O",
                "amino",
                ["amino", "neuro"],
                ["N", "C", "C", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 2],
                    [4, 6, 1],
                ],
            ),
            MoleculeCatalog.stampAminoAcid(
                "dopa",
                "DOPA",
                "C9H11NO4",
                "NC(CC1=CC(O)=C(O)C=C1)C(O)=O",
                "Y",
                [[8, 13, 1]],
                ["O"],
                [],
            ),
            MoleculeCatalog.make(
                "beta-alanine",
                "beta-Alanine",
                "C3H7NO2",
                "NCCC(O)=O",
                "amino",
                ["amino"],
                ["N", "C", "C", "C", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                ],
            ),
        ];
    }

    private static mergeParts(
        parts: ReadonlyArray<{ heavy: ReadonlyArray<string>; bonds: ReadonlyArray<CompactBond> }>,
        links: ReadonlyArray<readonly [number, number, number, number]> = [],
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const offsets: number[] = [];
        for (const part of parts) {
            offsets.push(heavy.length);
            heavy.push(...part.heavy);
            for (const b of part.bonds) {
                bonds.push([
                    b[0] + offsets[offsets.length - 1],
                    b[1] + offsets[offsets.length - 1],
                    b[2],
                ]);
            }
        }
        for (const link of links) {
            bonds.push([offsets[link[0]] + link[1], offsets[link[2]] + link[3], 1]);
        }
        return { heavy, bonds };
    }

    private static smilesDriven(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        category: MoleculeCategory,
        tags: string[],
        warn: boolean = false,
    ): ICompactMoleculeSpec {
        const parsed = new SmilesParser().parse(smiles);
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            category,
            tags,
            parsed.heavy,
            parsed.bonds,
            warn,
            "",
            parsed.charges,
            parsed.explicitH,
        );
    }

    public static formulaOf(
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<CompactBond>,
        charges: ReadonlyArray<readonly [number, number]> = [],
        explicitH: ReadonlyArray<readonly [number, number]> = [],
    ): string {
        const chargeMap = new Map<number, number>();
        for (const c of charges) {
            chargeMap.set(c[0], c[1]);
        }
        const explicitMap = new Map<number, number>();
        for (const h of explicitH) {
            explicitMap.set(h[0], h[1]);
        }
        const orderSum = new Array<number>(heavy.length).fill(0);
        for (const b of bonds) {
            const w = b[2] === 2 ? 2 : b[2] === 3 ? 3 : b[2] === 4 ? 1.5 : 1;
            orderSum[b[0]] += w;
            orderSum[b[1]] += w;
        }
        const counts = new Map<string, number>();
        for (let i = 0; i < heavy.length; i++) {
            const el = heavy[i];
            counts.set(el, (counts.get(el) ?? 0) + 1);
            let h: number;
            if (explicitMap.has(i)) {
                h = explicitMap.get(i) ?? 0;
            } else {
                h = ElementRegistry.implicitHydrogens(el, orderSum[i], chargeMap.get(i) ?? 0);
                h = Math.max(0, Math.round(h));
            }
            counts.set("H", (counts.get("H") ?? 0) + h);
        }
        const order = [
            "C",
            "H",
            "B",
            "Br",
            "Cl",
            "F",
            "I",
            "N",
            "O",
            "P",
            "S",
            "Si",
            "As",
            "Se",
            "Na",
            "K",
            "Ca",
            "Mg",
            "Fe",
            "Zn",
            "Cu",
            "Pt",
        ];
        let formula = "";
        for (const el of order) {
            const n = counts.get(el) ?? 0;
            if (n > 0) {
                formula += el + (n > 1 ? String(n) : "");
            }
            counts.delete(el);
        }
        for (const [el, n] of counts) {
            if (n > 0) {
                formula += el + (n > 1 ? String(n) : "");
            }
        }
        return formula;
    }

    private static aldohexopyranose(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "C", "O", "O", "O", "O", "O", "C", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 0, 1],
                [0, 6, 1],
                [1, 7, 1],
                [2, 8, 1],
                [3, 9, 1],
                [4, 10, 1],
                [10, 11, 1],
            ],
        };
    }

    private static ketohexofuranose(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "O", "C", "O", "O", "O", "O", "C", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 0, 1],
                [0, 5, 1],
                [5, 6, 1],
                [0, 7, 1],
                [1, 8, 1],
                [2, 9, 1],
                [3, 10, 1],
                [10, 11, 1],
            ],
        };
    }

    private static aldopentofuranose(deoxy: boolean): { heavy: string[]; bonds: CompactBond[] } {
        if (deoxy) {
            return {
                heavy: ["C", "C", "C", "C", "O", "O", "O", "C", "O"],
                bonds: [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 0, 1],
                    [0, 5, 1],
                    [2, 6, 1],
                    [3, 7, 1],
                    [7, 8, 1],
                ],
            };
        }
        return {
            heavy: ["C", "C", "C", "C", "O", "O", "O", "O", "C", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 0, 1],
                [0, 5, 1],
                [1, 6, 1],
                [2, 7, 1],
                [3, 8, 1],
                [8, 9, 1],
            ],
        };
    }

    private static aldopentopyranose(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "C", "O", "O", "O", "O", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 0, 1],
                [0, 6, 1],
                [1, 7, 1],
                [2, 8, 1],
                [3, 9, 1],
            ],
        };
    }

    private static glycosidicLink(
        a: { heavy: string[]; bonds: CompactBond[] },
        b: { heavy: string[]; bonds: CompactBond[] },
        aAtom: number,
        aOxygen: number,
        bAtom: number,
        bOxygen: number,
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy = [...a.heavy];
        const bonds: CompactBond[] = [...a.bonds];
        const remap = new Map<number, number>();
        for (let i = 0; i < b.heavy.length; i++) {
            if (i === bOxygen) {
                continue;
            }
            remap.set(i, heavy.length);
            heavy.push(b.heavy[i]);
        }
        for (const bb of b.bonds) {
            if (bb[0] === bOxygen || bb[1] === bOxygen) {
                continue;
            }
            bonds.push([remap.get(bb[0]) as number, remap.get(bb[1]) as number, bb[2]]);
        }
        bonds.push([aOxygen, remap.get(bAtom) as number, 1]);
        return { heavy, bonds };
    }

    private static glcnac(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "C", "O", "O", "N", "O", "O", "C", "O", "C", "O", "C"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 0, 1],
                [0, 6, 1],
                [1, 7, 1],
                [2, 8, 1],
                [3, 9, 1],
                [4, 10, 1],
                [10, 11, 1],
                [7, 12, 1],
                [12, 13, 2],
                [12, 14, 1],
            ],
        };
    }

    private static sugarEntry(
        id: string,
        name: string,
        smiles: string,
        graph: { heavy: string[]; bonds: CompactBond[] },
        tags: string[] = [],
    ): ICompactMoleculeSpec {
        const formula = MoleculeCatalog.formulaOf(graph.heavy, graph.bonds);
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            "sugars",
            ["sugar", ...tags],
            graph.heavy,
            graph.bonds,
        );
    }

    private static buildSugars(): ICompactMoleculeSpec[] {
        const glc = MoleculeCatalog.aldohexopyranose();
        const fru = MoleculeCatalog.ketohexofuranose();
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.sugarEntry(
                "glucose",
                "Glucose",
                "C(C1C(C(C(C(O1)O)O)O)O)O",
                MoleculeCatalog.aldohexopyranose(),
            ),
            MoleculeCatalog.sugarEntry(
                "fructose",
                "Fructose",
                "OC1C(O)C(O)C(O)(CO)O1",
                MoleculeCatalog.ketohexofuranose(),
            ),
            MoleculeCatalog.sugarEntry(
                "galactose",
                "Galactose",
                "C(C1C(C(C(C(O1)O)O)O)O)O",
                MoleculeCatalog.aldohexopyranose(),
            ),
            MoleculeCatalog.sugarEntry(
                "mannose",
                "Mannose",
                "C(C1C(C(C(C(O1)O)O)O)O)O",
                MoleculeCatalog.aldohexopyranose(),
            ),
            MoleculeCatalog.sugarEntry(
                "ribose",
                "Ribose",
                "C(C1C(C(C(O1)O)O)O)O",
                MoleculeCatalog.aldopentofuranose(false),
            ),
            MoleculeCatalog.sugarEntry(
                "deoxyribose",
                "Deoxyribose",
                "C(C1CC(C(O1)O)O)O",
                MoleculeCatalog.aldopentofuranose(true),
            ),
            MoleculeCatalog.sugarEntry(
                "xylose",
                "Xylose",
                "C(C1C(C(C(O1)O)O)O)O",
                MoleculeCatalog.aldopentopyranose(),
            ),
            MoleculeCatalog.sugarEntry(
                "glcnac",
                "N-Acetylglucosamine",
                "CC(=O)NC1C(C(C(OC1O)CO)O)O",
                MoleculeCatalog.glcnac(),
            ),
        ];
        const disaccharides: Array<
            [
                string,
                string,
                string,
                { heavy: string[]; bonds: CompactBond[] },
                { heavy: string[]; bonds: CompactBond[] },
                number,
                number,
                number,
                number,
            ]
        > = [
            [
                "sucrose",
                "Sucrose",
                "C(C1C(C(C(C(O1)OC2(C(C(C(O2)CO)O)O)CO)O)O)O)O",
                glc,
                fru,
                0,
                6,
                0,
                7,
            ],
            [
                "lactose",
                "Lactose",
                "C(C1C(C(C(C(O1)OC2C(C(C(OC2O)CO)O)O)O)O)O)O",
                glc,
                glc,
                0,
                6,
                3,
                9,
            ],
            [
                "maltose",
                "Maltose",
                "C(C1C(C(C(C(O1)OC2C(C(C(OC2O)CO)O)O)O)O)O)O",
                glc,
                glc,
                0,
                6,
                3,
                9,
            ],
            [
                "cellobiose",
                "Cellobiose",
                "C(C1C(C(C(C(O1)OC2C(C(C(OC2O)CO)O)O)O)O)O)O",
                glc,
                glc,
                0,
                6,
                3,
                9,
            ],
            [
                "trehalose",
                "Trehalose",
                "C(C1C(C(C(C(O1)OC2C(C(C(C(O2)CO)O)O)O)O)O)O)O",
                glc,
                glc,
                0,
                6,
                0,
                6,
            ],
        ];
        for (const [id, name, smiles, a, b, aa, ao, bb, bo] of disaccharides) {
            specs.push(
                MoleculeCatalog.sugarEntry(
                    id,
                    name,
                    smiles,
                    MoleculeCatalog.glycosidicLink(a, b, aa, ao, bb, bo),
                ),
            );
        }
        let cellulose = MoleculeCatalog.glycosidicLink(glc, glc, 0, 6, 3, 9);
        cellulose = MoleculeCatalog.glycosidicLink(
            cellulose,
            MoleculeCatalog.aldohexopyranose(),
            12,
            18,
            3,
            9,
        );
        specs.push(
            MoleculeCatalog.sugarEntry(
                "cellulose-fragment",
                "Cellulose Fragment",
                "C(C1C(C(C(C(O1)OC2C(C(C(OC2OC3C(C(C(OC3O)CO)O)O)O)CO)O)O)O)O)O)O",
                cellulose,
                ["polymer"],
            ),
        );
        let amylose = MoleculeCatalog.glycosidicLink(glc, glc, 0, 6, 3, 9);
        amylose = MoleculeCatalog.glycosidicLink(
            amylose,
            MoleculeCatalog.aldohexopyranose(),
            12,
            18,
            3,
            9,
        );
        specs.push(
            MoleculeCatalog.sugarEntry(
                "amylose-fragment",
                "Amylose Fragment",
                "C(C1C(C(C(C(O1)OC2C(C(C(OC2OC3C(C(C(OC3O)CO)O)O)O)CO)O)O)O)O)O)O",
                amylose,
                ["polymer"],
            ),
        );
        const chitin = MoleculeCatalog.glycosidicLink(
            MoleculeCatalog.glcnac(),
            MoleculeCatalog.glcnac(),
            0,
            6,
            3,
            9,
        );
        specs.push(
            MoleculeCatalog.sugarEntry(
                "chitin-fragment",
                "Chitin Fragment",
                "CC(=O)NC1C(C(C(OC1OC2C(C(C(OC2O)CO)O)NC(C)=O)O)CO)O)O",
                chitin,
                ["polymer"],
            ),
        );
        return specs;
    }

    private static adeninePart(substituted: boolean): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        return {
            heavy: ["C", "N", "C", "N", "C", "C", "N", "C", "N", "N"],
            bonds: [
                [0, 1, 4],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 0, 4],
                [4, 6, 4],
                [6, 7, 4],
                [7, 8, 4],
                [8, 5, 4],
                [0, 9, 1],
            ],
            linkN: 8,
            extraH: substituted ? [] : [[8, 1]],
        };
    }

    private static guaninePart(substituted: boolean): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        return {
            heavy: ["C", "N", "C", "N", "C", "C", "N", "C", "N", "O", "N"],
            bonds: [
                [0, 1, 4],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 0, 4],
                [4, 6, 4],
                [6, 7, 4],
                [7, 8, 4],
                [8, 5, 4],
                [0, 9, 2],
                [2, 10, 1],
            ],
            linkN: 8,
            extraH: substituted
                ? [[1, 1]]
                : [
                      [1, 1],
                      [8, 1],
                  ],
        };
    }

    private static cytosinePart(substituted: boolean): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        return {
            heavy: ["N", "C", "N", "C", "C", "C", "N", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 2],
                [3, 4, 1],
                [4, 5, 2],
                [5, 0, 1],
                [3, 6, 1],
                [1, 7, 2],
            ],
            linkN: 0,
            extraH: substituted ? [] : [[0, 1]],
        };
    }

    private static thyminePart(substituted: boolean): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        return {
            heavy: ["N", "C", "N", "C", "C", "C", "O", "O", "C"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 2],
                [5, 0, 1],
                [1, 6, 2],
                [3, 7, 2],
                [4, 8, 1],
            ],
            linkN: 0,
            extraH: substituted
                ? [[2, 1]]
                : [
                      [0, 1],
                      [2, 1],
                  ],
        };
    }

    private static uracilPart(substituted: boolean): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        return {
            heavy: ["N", "C", "N", "C", "C", "C", "O", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 2],
                [5, 0, 1],
                [1, 6, 2],
                [3, 7, 2],
            ],
            linkN: 0,
            extraH: substituted
                ? [[2, 1]]
                : [
                      [0, 1],
                      [2, 1],
                  ],
        };
    }

    private static ribosePart(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "O", "O", "O", "C", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 0, 1],
                [1, 5, 1],
                [2, 6, 1],
                [3, 7, 1],
                [7, 8, 1],
            ],
        };
    }

    private static deoxyribosePart(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: ["C", "C", "C", "C", "O", "O", "C", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 0, 1],
                [2, 5, 1],
                [3, 6, 1],
                [6, 7, 1],
            ],
        };
    }

    private static buildNucleoside(
        base: {
            heavy: string[];
            bonds: CompactBond[];
            linkN: number;
            extraH: Array<readonly [number, number]>;
        },
        sugar: { heavy: string[]; bonds: CompactBond[] },
    ): {
        heavy: string[];
        bonds: CompactBond[];
        extraH: Array<readonly [number, number]>;
        o5: number;
    } {
        const merged = MoleculeCatalog.mergeParts([base, sugar], [[0, base.linkN, 1, 0]]);
        const offset = base.heavy.length;
        const shiftedH = base.extraH.map((h) => [h[0], h[1]] as const);
        return {
            heavy: merged.heavy,
            bonds: merged.bonds,
            extraH: shiftedH,
            o5: offset + sugar.heavy.length - 1,
        };
    }

    private static addPhosphateChain(
        g: { heavy: string[]; bonds: CompactBond[] },
        fromO: number,
        count: number,
        lastTerms: number = 3,
    ): { heavy: string[]; bonds: CompactBond[]; terminals: number[]; pLast: number } {
        const heavy = [...g.heavy];
        const bonds: CompactBond[] = [...g.bonds];
        const terminals: number[] = [];
        let linkO = fromO;
        let pLast = -1;
        for (let k = 0; k < count; k++) {
            const p = heavy.length;
            heavy.push("P");
            bonds.push([linkO, p, 1]);
            pLast = p;
            const totalTerms = k === count - 1 ? lastTerms : 2;
            for (let t = 0; t < totalTerms; t++) {
                const o = heavy.length;
                heavy.push("O");
                bonds.push([p, o, t === 0 ? 2 : 1]);
                terminals.push(o);
            }
            if (k < count - 1) {
                const bridge = heavy.length;
                heavy.push("O");
                bonds.push([p, bridge, 1]);
                linkO = bridge;
            }
        }
        return { heavy, bonds, terminals, pLast };
    }

    private static nucleotideEntry(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<CompactBond>,
        charges: ReadonlyArray<readonly [number, number]> = [],
        explicitH: ReadonlyArray<readonly [number, number]> = [],
        tags: string[] = [],
    ): ICompactMoleculeSpec {
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            "nucleotides",
            ["nucleotide", ...tags],
            [...heavy],
            [...bonds],
            false,
            "",
            charges,
            explicitH,
        );
    }

    private static buildNucleotides(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [];
        const freeBase = (
            id: string,
            name: string,
            formula: string,
            smiles: string,
            part: {
                heavy: string[];
                bonds: CompactBond[];
                extraH: Array<readonly [number, number]>;
            },
        ): void => {
            specs.push(
                MoleculeCatalog.nucleotideEntry(
                    id,
                    name,
                    formula,
                    smiles,
                    part.heavy,
                    part.bonds,
                    [],
                    part.extraH,
                    ["base"],
                ),
            );
        };
        freeBase(
            "adenine",
            "Adenine",
            "C5H5N5",
            "Nc1ncnc2[nH]cnc12",
            MoleculeCatalog.adeninePart(false),
        );
        freeBase(
            "guanine",
            "Guanine",
            "C5H5N5O",
            "Nc1nc2[nH]cnc2c(=O)[nH]1",
            MoleculeCatalog.guaninePart(false),
        );
        freeBase(
            "cytosine",
            "Cytosine",
            "C4H5N3O",
            "Nc1ccn[H]c1=O",
            MoleculeCatalog.cytosinePart(false),
        );
        freeBase(
            "thymine",
            "Thymine",
            "C5H6N2O2",
            "Cc1c[nH]c(=O)[nH]c1=O",
            MoleculeCatalog.thyminePart(false),
        );
        freeBase(
            "uracil",
            "Uracil",
            "C4H4N2O2",
            "O=c1cc[nH]c(=O)[nH]c1=O",
            MoleculeCatalog.uracilPart(false),
        );

        const adenosine = MoleculeCatalog.buildNucleoside(
            MoleculeCatalog.adeninePart(true),
            MoleculeCatalog.ribosePart(),
        );
        const guanosine = MoleculeCatalog.buildNucleoside(
            MoleculeCatalog.guaninePart(true),
            MoleculeCatalog.ribosePart(),
        );
        const atpGraph = MoleculeCatalog.addPhosphateChain(adenosine, adenosine.o5, 3);
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "atp",
                "ATP",
                "C10H16N5O13P3",
                "Nc1ncnc2n(cnc12)C1OC(COP(=O)(O)OP(=O)(O)OP(=O)(O)O)C(O)C1O",
                atpGraph.heavy,
                atpGraph.bonds,
                [],
                adenosine.extraH,
                ["energy"],
            ),
        );
        const adpGraph = MoleculeCatalog.addPhosphateChain(adenosine, adenosine.o5, 2);
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "adp",
                "ADP",
                "C10H15N5O10P2",
                "Nc1ncnc2n(cnc12)C1OC(COP(=O)(O)OP(=O)(O)O)C(O)C1O",
                adpGraph.heavy,
                adpGraph.bonds,
                [],
                adenosine.extraH,
                ["energy"],
            ),
        );
        const ampGraph = MoleculeCatalog.addPhosphateChain(adenosine, adenosine.o5, 1);
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "amp",
                "AMP",
                "C10H14N5O7P",
                "Nc1ncnc2n(cnc12)C1OC(COP(=O)(O)O)C(O)C1O",
                ampGraph.heavy,
                ampGraph.bonds,
                [],
                adenosine.extraH,
                ["energy"],
            ),
        );
        const gtpGraph = MoleculeCatalog.addPhosphateChain(guanosine, guanosine.o5, 3);
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "gtp",
                "GTP",
                "C10H16N5O14P3",
                "Nc1nc2n(cnc2c(=O)[nH]1)C1OC(COP(=O)(O)OP(=O)(O)OP(=O)(O)O)C(O)C1O",
                gtpGraph.heavy,
                gtpGraph.bonds,
                [],
                guanosine.extraH,
                ["energy"],
            ),
        );
        const dihydroPart = {
            heavy: ["N", "C", "C", "C", "C", "C", "C", "O", "N"],
            bonds: [
                [0, 1, 1],
                [1, 2, 2],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 2],
                [5, 0, 1],
                [2, 6, 1],
                [6, 7, 2],
                [6, 8, 1],
            ] as CompactBond[],
        };
        const nicRiboside = MoleculeCatalog.mergeParts(
            [dihydroPart, MoleculeCatalog.ribosePart()],
            [[0, 0, 1, 0]],
        );
        const nadLeft = MoleculeCatalog.addPhosphateChain(adenosine, adenosine.o5, 2, 2);
        const nadhMerged = MoleculeCatalog.mergeParts(
            [nadLeft, nicRiboside],
            [[0, nadLeft.pLast, 1, 17]],
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "nadh",
                "NADH",
                "C21H29N7O14P2",
                "NC(=O)C1CCC(N(C1)C2OC(COP(=O)(O)OP(=O)(O)OCC3OC(N4C=NC5=C4N=CN=C5N)C(O)C3O)C(O)C2O)",
                nadhMerged.heavy,
                nadhMerged.bonds,
                [],
                adenosine.extraH,
                ["energy", "cofactor"],
            ),
        );
        const nadphHeavy = [...nadhMerged.heavy];
        const nadphBonds: CompactBond[] = [...nadhMerged.bonds];
        const nadpP = nadphHeavy.length;
        nadphHeavy.push("P", "O", "O", "O");
        nadphBonds.push(
            [15, nadpP, 1],
            [nadpP, nadpP + 1, 2],
            [nadpP, nadpP + 2, 1],
            [nadpP, nadpP + 3, 1],
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "nadph",
                "NADPH",
                "C21H30N7O17P3",
                "NC(=O)C1CCC(N(C1)C2OC(COP(=O)(O)OP(=O)(O)OCC3OC(N4C=NC5=C4N=CN=C5N)C(OP(=O)(O)O)C3O)C(O)C2O)",
                nadphHeavy,
                nadphBonds,
                [],
                adenosine.extraH,
                ["energy", "cofactor"],
            ),
        );
        const flavinPart = {
            heavy: [
                "N",
                "C",
                "N",
                "C",
                "C",
                "C",
                "N",
                "C",
                "C",
                "N",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "O",
                "O",
            ],
            bonds: [
                [0, 1, 4],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 0, 4],
                [5, 9, 4],
                [9, 8, 4],
                [8, 7, 4],
                [7, 6, 4],
                [6, 4, 4],
                [7, 10, 4],
                [10, 11, 4],
                [11, 12, 4],
                [12, 13, 4],
                [13, 8, 4],
                [11, 14, 1],
                [12, 15, 1],
                [1, 16, 2],
                [3, 17, 2],
            ] as CompactBond[],
        };
        const ribitylPart = {
            heavy: ["C", "C", "C", "C", "C", "O", "O", "O", "O"],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [1, 5, 1],
                [2, 6, 1],
                [3, 7, 1],
                [4, 8, 1],
            ] as CompactBond[],
        };
        const fmnPart = MoleculeCatalog.mergeParts([flavinPart, ribitylPart], [[0, 6, 1, 0]]);
        const fadLeft = MoleculeCatalog.addPhosphateChain(adenosine, adenosine.o5, 2, 2);
        const fadMerged = MoleculeCatalog.mergeParts(
            [fadLeft, fmnPart],
            [[0, fadLeft.pLast, 1, 26]],
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "fad",
                "FAD",
                "C27H33N9O15P2",
                "CC1=CC2=C(C=C1C)N(C3=NC(=O)NC(=O)C3=N2)CC(O)C(O)C(O)COP(=O)(O)OP(=O)(O)OCC4OC(N5C=NC6=C5N=CN=C6N)C(O)C4O",
                fadMerged.heavy,
                fadMerged.bonds,
                [],
                [...adenosine.extraH, [26 + 2, 1] as const],
                ["energy", "cofactor"],
            ),
        );
        const pantPart = {
            heavy: [
                "O",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "O",
                "N",
                "C",
                "C",
                "C",
                "O",
                "N",
                "C",
                "C",
                "S",
                "O",
            ],
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [2, 4, 1],
                [2, 5, 1],
                [5, 17, 1],
                [5, 6, 1],
                [6, 7, 2],
                [6, 8, 1],
                [8, 9, 1],
                [9, 10, 1],
                [10, 11, 1],
                [11, 12, 2],
                [11, 13, 1],
                [13, 14, 1],
                [14, 15, 1],
                [15, 16, 1],
            ] as CompactBond[],
        };
        const coaBase = MoleculeCatalog.addPhosphateChain(adenosine, 16, 1);
        const coaMid = MoleculeCatalog.addPhosphateChain(coaBase, adenosine.o5, 2, 2);
        const coaMerged = MoleculeCatalog.mergeParts([coaMid, pantPart], [[0, coaMid.pLast, 1, 0]]);
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "coa",
                "Coenzyme A",
                "C21H36N7O16P3S",
                "CC(C)(COP(=O)(O)OP(=O)(O)OCC1OC(N2C=NC3=C2N=CN=C3N)C(O)C1OP(=O)(O)O)C(O)C(=O)NCCC(=O)NCCS",
                coaMerged.heavy,
                coaMerged.bonds,
                [],
                adenosine.extraH,
                ["energy", "cofactor"],
            ),
        );
        const atPair = MoleculeCatalog.mergeParts(
            [MoleculeCatalog.adeninePart(false), MoleculeCatalog.thyminePart(false)],
            [],
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "at-pair",
                "A-T Base Pair",
                "C10H11N7O2",
                "Nc1ncnc2[nH]cnc12.Cc1c[nH]c(=O)[nH]c1=O",
                atPair.heavy,
                atPair.bonds,
                [],
                [
                    ...MoleculeCatalog.adeninePart(false).extraH,
                    ...MoleculeCatalog.thyminePart(false).extraH.map(
                        (h) => [h[0] + 10, h[1]] as const,
                    ),
                ],
                ["base-pair"],
            ),
        );
        const gcPair = MoleculeCatalog.mergeParts(
            [MoleculeCatalog.guaninePart(false), MoleculeCatalog.cytosinePart(false)],
            [],
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "gc-pair",
                "G-C Base Pair",
                "C9H10N8O2",
                "Nc1nc2[nH]cnc2c(=O)[nH]1.Nc1ccn[H]c1=O",
                gcPair.heavy,
                gcPair.bonds,
                [],
                [
                    ...MoleculeCatalog.guaninePart(false).extraH,
                    ...MoleculeCatalog.cytosinePart(false).extraH.map(
                        (h) => [h[0] + 11, h[1]] as const,
                    ),
                ],
                ["base-pair"],
            ),
        );
        const dnaTop = MoleculeCatalog.buildDnaStrand("ATGCGTACGTAG", false);
        const dnaBottom = MoleculeCatalog.buildDnaStrand("CTACGTACGCAT", true);
        const dnaMerged = MoleculeCatalog.mergeParts([dnaTop.graph, dnaBottom.graph], []);
        const dnaBottomOffset = dnaTop.graph.heavy.length;
        const dnaCharges = dnaTop.charges.concat(
            dnaBottom.charges.map((c) => [c[0] + dnaBottomOffset, c[1]] as const),
        );
        const dnaExtraH = dnaTop.extraH.concat(
            dnaBottom.extraH.map((h) => [h[0] + dnaBottomOffset, h[1]] as const),
        );
        const dnaFormula = MoleculeCatalog.formulaOf(
            dnaMerged.heavy,
            dnaMerged.bonds,
            dnaCharges,
            dnaExtraH,
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "dna-duplex",
                "DNA Duplex (12-mer)",
                dnaFormula,
                "DNA 12-mer duplex",
                dnaMerged.heavy,
                dnaMerged.bonds,
                dnaCharges,
                dnaExtraH,
                ["biomolecule", "helix"],
            ),
        );
        const rnaStrand = MoleculeCatalog.buildRnaStrand("GCGCAUUGCG");
        const rnaFormula = MoleculeCatalog.formulaOf(
            rnaStrand.graph.heavy,
            rnaStrand.graph.bonds,
            rnaStrand.charges,
            rnaStrand.extraH,
        );
        specs.push(
            MoleculeCatalog.nucleotideEntry(
                "rna-hairpin",
                "RNA Hairpin (10-mer)",
                rnaFormula,
                "RNA 10-mer hairpin",
                rnaStrand.graph.heavy,
                rnaStrand.graph.bonds,
                rnaStrand.charges,
                rnaStrand.extraH,
                ["biomolecule"],
            ),
        );
        return specs;
    }

    private static dnaBase(ch: string): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        if (ch === "A") {
            return MoleculeCatalog.adeninePart(true);
        }
        if (ch === "G") {
            return MoleculeCatalog.guaninePart(true);
        }
        if (ch === "C") {
            return MoleculeCatalog.cytosinePart(true);
        }
        return MoleculeCatalog.thyminePart(true);
    }

    private static rnaBase(ch: string): {
        heavy: string[];
        bonds: CompactBond[];
        linkN: number;
        extraH: Array<readonly [number, number]>;
    } {
        if (ch === "A") {
            return MoleculeCatalog.adeninePart(true);
        }
        if (ch === "G") {
            return MoleculeCatalog.guaninePart(true);
        }
        if (ch === "C") {
            return MoleculeCatalog.cytosinePart(true);
        }
        return MoleculeCatalog.uracilPart(true);
    }

    private static buildDnaStrand(
        sequence: string,
        reverse: boolean,
    ): {
        graph: { heavy: string[]; bonds: CompactBond[] };
        charges: Array<readonly [number, number]>;
        extraH: Array<readonly [number, number]>;
    } {
        const seq = reverse ? sequence.split("").reverse().join("") : sequence;
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const charges: Array<readonly [number, number]> = [];
        const extraH: Array<readonly [number, number]> = [];
        let prevPhosphate = -1;
        for (let i = 0; i < seq.length; i++) {
            const base = MoleculeCatalog.dnaBase(seq[i]);
            const sugar = MoleculeCatalog.deoxyribosePart();
            const nt = MoleculeCatalog.mergeParts([base, sugar], [[0, base.linkN, 1, 0]]);
            const ntOffset = heavy.length;
            heavy.push(...nt.heavy);
            for (const b of nt.bonds) {
                bonds.push([b[0] + ntOffset, b[1] + ntOffset, b[2]]);
            }
            for (const h of base.extraH) {
                extraH.push([h[0] + ntOffset, h[1]]);
            }
            const o5 = ntOffset + base.heavy.length + 7;
            const o3 = ntOffset + base.heavy.length + 5;
            if (prevPhosphate >= 0) {
                bonds.push([prevPhosphate, o5, 1]);
            }
            if (i < seq.length - 1) {
                const p = heavy.length;
                heavy.push("P", "O", "O");
                bonds.push([o3, p, 1], [p, heavy.length - 2, 2], [p, heavy.length - 1, 1]);
                charges.push([heavy.length - 1, -1]);
                prevPhosphate = p;
            }
        }
        return { graph: { heavy, bonds }, charges, extraH };
    }

    private static buildRnaStrand(sequence: string): {
        graph: { heavy: string[]; bonds: CompactBond[] };
        charges: Array<readonly [number, number]>;
        extraH: Array<readonly [number, number]>;
    } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const charges: Array<readonly [number, number]> = [];
        const extraH: Array<readonly [number, number]> = [];
        let prevPhosphate = -1;
        for (let i = 0; i < sequence.length; i++) {
            const base = MoleculeCatalog.rnaBase(sequence[i]);
            const sugar = MoleculeCatalog.ribosePart();
            const nt = MoleculeCatalog.mergeParts([base, sugar], [[0, base.linkN, 1, 0]]);
            const ntOffset = heavy.length;
            heavy.push(...nt.heavy);
            for (const b of nt.bonds) {
                bonds.push([b[0] + ntOffset, b[1] + ntOffset, b[2]]);
            }
            for (const h of base.extraH) {
                extraH.push([h[0] + ntOffset, h[1]]);
            }
            const o5 = ntOffset + base.heavy.length + 8;
            const o3 = ntOffset + base.heavy.length + 6;
            if (prevPhosphate >= 0) {
                bonds.push([prevPhosphate, o5, 1]);
            }
            if (i < sequence.length - 1) {
                const p = heavy.length;
                heavy.push("P", "O", "O");
                bonds.push([o3, p, 1], [p, heavy.length - 2, 2], [p, heavy.length - 1, 1]);
                charges.push([heavy.length - 1, -1]);
                prevPhosphate = p;
            }
        }
        return { graph: { heavy, bonds }, charges, extraH };
    }

    private static steroidNucleus(): { heavy: string[]; bonds: CompactBond[] } {
        return {
            heavy: MoleculeCatalog.carbons(17),
            bonds: [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 0, 1],
                [5, 6, 1],
                [6, 7, 1],
                [7, 8, 1],
                [8, 9, 1],
                [9, 4, 1],
                [9, 10, 1],
                [10, 11, 1],
                [11, 12, 1],
                [12, 13, 1],
                [13, 8, 1],
                [13, 14, 1],
                [14, 15, 1],
                [15, 16, 1],
                [16, 12, 1],
            ],
        };
    }

    private static fattyAcid(
        id: string,
        name: string,
        formula: string,
        smiles: string,
        carbons: number,
        doubles: Array<[number, string]>,
    ): ICompactMoleculeSpec {
        const heavy: string[] = MoleculeCatalog.carbons(carbons - 1);
        heavy.push("C", "O", "O");
        const bonds: CompactBond[] = [];
        for (let i = 0; i < carbons - 2; i++) {
            const dbl = doubles.find((d) => d[0] === i);
            if (dbl !== undefined) {
                bonds.push([i, i + 1, 2, dbl[1]]);
            } else {
                bonds.push([i, i + 1, 1]);
            }
        }
        const c = carbons - 1;
        bonds.push([c - 1, c, 1], [c, c + 1, 2], [c, c + 2, 1]);
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            "lipids",
            ["lipid", "fatty-acid"],
            heavy,
            bonds,
        );
    }

    private static buildLipids(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [];
        const sterol = (
            id: string,
            name: string,
            formula: string,
            smiles: string,
            extraHeavy: string[],
            extraBonds: CompactBond[],
            tags: string[] = [],
        ): void => {
            const nuc = MoleculeCatalog.steroidNucleus();
            specs.push(
                MoleculeCatalog.make(
                    id,
                    name,
                    formula,
                    smiles,
                    "lipids",
                    ["lipid", "steroid", ...tags],
                    [...nuc.heavy, ...extraHeavy],
                    [...nuc.bonds, ...extraBonds],
                ),
            );
        };
        sterol(
            "cholesterol",
            "Cholesterol",
            "C27H46O",
            "CC(C)CCCC(C)C1CCC2C3CC=C4CC(O)CCC4(C)C3CCC12C",
            ["O", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C"],
            [
                [2, 17, 1],
                [5, 6, 2],
                [4, 18, 1],
                [12, 19, 1],
                [14, 20, 1],
                [20, 21, 1],
                [20, 27, 1],
                [21, 22, 1],
                [22, 23, 1],
                [23, 24, 1],
                [24, 25, 1],
                [24, 26, 1],
            ],
        );
        sterol(
            "testosterone",
            "Testosterone",
            "C19H28O2",
            "CC12CCC3C4CCC(O)C4(C)CCC3C1CCC2=O",
            ["O", "C", "C", "O"],
            [
                [2, 17, 2],
                [3, 4, 2],
                [14, 20, 1],
                [5, 18, 1],
                [12, 19, 1],
            ],
        );
        sterol(
            "estradiol",
            "Estradiol",
            "C18H24O2",
            "CC12CCC3C4CCC(O)C4(C)CCC3C1=CC=C(O)C=C2",
            ["O", "C", "O"],
            [
                [0, 1, 4],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 0, 4],
                [0, 17, 1],
                [14, 19, 1],
                [12, 18, 1],
            ],
        );
        sterol(
            "progesterone",
            "Progesterone",
            "C21H30O2",
            "CC(=O)C1CCC2C3CCC4=CC(=O)CCC4(C)C3CCC12C",
            ["O", "C", "C", "O", "C", "C"],
            [
                [2, 17, 2],
                [3, 4, 2],
                [14, 18, 1],
                [18, 19, 1],
                [18, 20, 2],
                [5, 21, 1],
                [12, 22, 1],
            ],
        );
        sterol(
            "cortisol",
            "Cortisol",
            "C21H30O5",
            "CC12CCC3C4CCC(O)C4(C)CCC3C1CC(O)C(O)=CC2=O",
            ["O", "C", "C", "O", "O", "O", "O", "C", "C"],
            [
                [2, 17, 2],
                [3, 4, 2],
                [10, 22, 1],
                [14, 23, 1],
                [14, 18, 1],
                [18, 19, 1],
                [18, 20, 2],
                [19, 21, 1],
                [5, 24, 1],
                [12, 25, 1],
            ],
        );
        sterol(
            "aldosterone",
            "Aldosterone",
            "C21H28O5",
            "O=CC12CCC3C4CCC(O)C4(C)CCC3C1CC(O)C(O)=CC2=O",
            ["O", "C", "C", "O", "O", "C", "O", "O", "C"],
            [
                [2, 17, 2],
                [3, 4, 2],
                [10, 24, 1],
                [14, 18, 1],
                [18, 19, 1],
                [18, 20, 2],
                [19, 21, 1],
                [12, 22, 1],
                [22, 23, 2],
                [5, 25, 1],
            ],
        );
        const vitdHeavy: string[] = [
            ...MoleculeCatalog.carbons(17),
            "O",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
        ];
        const vitdBonds: CompactBond[] = [
            [0, 1, 1],
            [1, 2, 1],
            [2, 3, 1],
            [3, 4, 1],
            [4, 5, 1],
            [5, 0, 1],
            [4, 6, 2],
            [6, 7, 1],
            [7, 8, 2],
            [8, 9, 1],
            [9, 10, 1],
            [10, 11, 1],
            [11, 12, 1],
            [12, 13, 1],
            [13, 8, 1],
            [13, 14, 1],
            [14, 15, 1],
            [15, 16, 1],
            [16, 12, 1],
            [5, 26, 2],
            [2, 17, 1],
            [12, 18, 1],
            [14, 19, 1],
            [19, 20, 1],
            [19, 27, 1],
            [20, 21, 1],
            [21, 22, 1],
            [22, 23, 1],
            [23, 24, 1],
            [23, 25, 1],
        ];
        specs.push(
            MoleculeCatalog.make(
                "vitamin-d3",
                "Vitamin D3",
                "C27H44O",
                "CC(C)CCCC(C)C1CCC2C1CCCC2=CC=C3CC(O)CCC3=C",
                "lipids",
                ["lipid", "steroid", "vitamin"],
                vitdHeavy,
                vitdBonds,
            ),
        );
        sterol(
            "cholic-acid",
            "Cholic Acid",
            "C24H40O5",
            "CC(CCC(O)=O)C1CCC2C3CC(O)CC(O)C3(C)CC(O)C12C",
            ["O", "O", "O", "C", "C", "C", "C", "C", "C", "C", "O", "O"],
            [
                [2, 17, 1],
                [6, 18, 1],
                [10, 19, 1],
                [4, 20, 1],
                [12, 21, 1],
                [14, 22, 1],
                [22, 23, 1],
                [22, 24, 1],
                [24, 25, 1],
                [25, 26, 1],
                [26, 27, 2],
                [26, 28, 1],
            ],
        );
        specs.push(
            MoleculeCatalog.fattyAcid(
                "palmitic-acid",
                "Palmitic Acid",
                "C16H32O2",
                "CCCCCCCCCCCCCCCC(O)=O",
                16,
                [],
            ),
        );
        specs.push(
            MoleculeCatalog.fattyAcid(
                "oleic-acid",
                "Oleic Acid",
                "C18H34O2",
                "CCCCCCCCC=CCCCCCCCC(O)=O",
                18,
                [[8, "Z"]],
            ),
        );
        specs.push(
            MoleculeCatalog.fattyAcid(
                "linoleic-acid",
                "Linoleic Acid",
                "C18H32O2",
                "CCCCC=CCC=CCCCCCCCC(O)=O",
                18,
                [
                    [8, "Z"],
                    [11, "Z"],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.fattyAcid(
                "arachidonic-acid",
                "Arachidonic Acid",
                "C20H32O2",
                "CCCCC=CCC=CCC=CCC=CCCCC(O)=O",
                20,
                [
                    [4, "Z"],
                    [7, "Z"],
                    [10, "Z"],
                    [13, "Z"],
                ],
            ),
        );
        const tristearinHeavy: string[] = ["C", "C", "C"];
        const tristearinBonds: CompactBond[] = [
            [0, 1, 1],
            [1, 2, 1],
        ];
        for (let k = 0; k < 3; k++) {
            const cIdx = tristearinHeavy.length;
            tristearinHeavy.push("C", "O", "O");
            tristearinBonds.push([k, cIdx + 2, 1], [cIdx, cIdx + 1, 2], [cIdx, cIdx + 2, 1]);
            let prev = cIdx;
            for (let j = 0; j < 17; j++) {
                const n = tristearinHeavy.length;
                tristearinHeavy.push("C");
                tristearinBonds.push([prev, n, 1]);
                prev = n;
            }
        }
        specs.push(
            MoleculeCatalog.make(
                "tristearin",
                "Tristearin",
                "C57H110O6",
                "CCCCCCCCCCCCCCCCCC(=O)OCC(OC(=O)CCCCCCCCCCCCCCCCC)COC(=O)CCCCCCCCCCCCCCCCC",
                "lipids",
                ["lipid"],
                tristearinHeavy,
                tristearinBonds,
            ),
        );
        const dppcHeavy: string[] = ["C", "C", "C"];
        const dppcBonds: CompactBond[] = [
            [0, 1, 1],
            [1, 2, 1],
        ];
        for (const gIdx of [0, 1]) {
            const cIdx = dppcHeavy.length;
            dppcHeavy.push("C", "O", "O");
            dppcBonds.push([gIdx, cIdx + 2, 1], [cIdx, cIdx + 1, 2], [cIdx, cIdx + 2, 1]);
            let prev = cIdx;
            for (let j = 0; j < 15; j++) {
                const n = dppcHeavy.length;
                dppcHeavy.push("C");
                dppcBonds.push([prev, n, 1]);
                prev = n;
            }
        }
        const ppcP = dppcHeavy.length;
        dppcHeavy.push("P", "O", "O", "O", "O", "C", "C", "N", "C", "C", "C");
        const ppcO = ppcP + 1;
        dppcBonds.push(
            [2, ppcO, 1],
            [ppcO, ppcP, 1],
            [ppcP, ppcP + 2, 2],
            [ppcP, ppcP + 3, 1],
            [ppcP + 3, ppcP + 4, 1],
            [ppcP + 4, ppcP + 5, 1],
            [ppcP + 5, ppcP + 6, 1],
            [ppcP + 6, ppcP + 7, 1],
            [ppcP + 7, ppcP + 8, 1],
            [ppcP + 7, ppcP + 9, 1],
            [ppcP + 7, ppcP + 10, 1],
        );
        specs.push(
            MoleculeCatalog.make(
                "phosphatidylcholine",
                "Phosphatidylcholine",
                "C40H80NO8P",
                "CCCCCCCCCCCCCCCC(=O)OCC(COP(=O)([O-])OCC[N+](C)(C)C)OC(=O)CCCCCCCCCCCCCCC",
                "lipids",
                ["lipid"],
                dppcHeavy,
                dppcBonds,
                false,
                "",
                [
                    [ppcP + 7, 1],
                    [ppcP + 3, -1],
                ],
            ),
        );
        const sphHeavy: string[] = [
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
            "O",
            "O",
            "N",
        ];
        const sphBonds: CompactBond[] = [];
        for (let i = 0; i < 17; i++) {
            sphBonds.push(i === 3 ? [i, i + 1, 2] : [i, i + 1, 1]);
        }
        sphBonds.push([1, 18, 1], [2, 19, 1], [2, 20, 1]);
        const sphAmide = sphHeavy.length;
        sphHeavy.push("C", "O");
        sphBonds.push([20, sphAmide, 1], [sphAmide, sphAmide + 1, 2]);
        let sphPrev = sphAmide;
        for (let j = 0; j < 15; j++) {
            const n = sphHeavy.length;
            sphHeavy.push("C");
            sphBonds.push([sphPrev, n, 1]);
            sphPrev = n;
        }
        const sphP = sphHeavy.length;
        sphHeavy.push("P", "O", "O", "O", "O", "C", "C", "N", "C", "C", "C");
        sphBonds.push(
            [18, sphP + 1, 1],
            [sphP + 1, sphP, 1],
            [sphP, sphP + 2, 2],
            [sphP, sphP + 3, 1],
            [sphP + 3, sphP + 4, 1],
            [sphP + 4, sphP + 5, 1],
            [sphP + 5, sphP + 6, 1],
            [sphP + 6, sphP + 7, 1],
            [sphP + 7, sphP + 8, 1],
            [sphP + 7, sphP + 9, 1],
            [sphP + 7, sphP + 10, 1],
        );
        const sphFormula = MoleculeCatalog.formulaOf(sphHeavy, sphBonds, [
            [sphP + 7, 1],
            [sphP + 3, -1],
        ]);
        specs.push(
            MoleculeCatalog.make(
                "sphingomyelin",
                "Sphingomyelin",
                sphFormula,
                "CCCCCCCCCCCCCCCC(=O)NC(COP(=O)([O-])OCC[N+](C)(C)C)C(O)C=CCCCCCCCCCCC",
                "lipids",
                ["lipid"],
                sphHeavy,
                sphBonds,
                false,
                "",
                [
                    [sphP + 7, 1],
                    [sphP + 3, -1],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "capsaicin",
                "Capsaicin",
                "C18H27NO3",
                "COC1=C(O)C=C(CCNC(=O)CCCC/C=C/C(C)C)C=C1",
                "lipids",
                ["lipid", "natural"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "N",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [1, 6, 1],
                    [2, 7, 1],
                    [7, 8, 1],
                    [5, 9, 1],
                    [9, 10, 1],
                    [10, 11, 1],
                    [11, 12, 2],
                    [11, 13, 1],
                    [13, 14, 1],
                    [14, 15, 1],
                    [15, 16, 1],
                    [16, 17, 1],
                    [17, 18, 2, "E"],
                    [18, 19, 1],
                    [19, 20, 1],
                    [19, 21, 1],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "thc",
                "THC",
                "C21H30O2",
                "CCCCC1=CC(O)=C2C(OC(C)(C)C3CCC(C)=CC32)=C1",
                "lipids",
                ["lipid", "natural"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [5, 9, 1],
                    [9, 8, 1],
                    [8, 7, 1],
                    [7, 6, 1],
                    [6, 4, 1],
                    [9, 10, 1],
                    [10, 11, 1],
                    [11, 12, 2],
                    [12, 13, 1],
                    [13, 8, 1],
                    [1, 14, 1],
                    [3, 15, 1],
                    [15, 16, 1],
                    [16, 17, 1],
                    [17, 18, 1],
                    [18, 19, 1],
                    [7, 20, 1],
                    [7, 21, 1],
                    [11, 22, 1],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "cbd",
                "CBD",
                "C21H30O2",
                "CCCCC1=CC(O)=C(O)C(=C1)C2CCC(C)=CC2C(C)=C",
                "lipids",
                ["lipid", "natural"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [1, 6, 1],
                    [3, 7, 1],
                    [4, 8, 1],
                    [8, 9, 1],
                    [9, 10, 2],
                    [10, 11, 1],
                    [11, 12, 1],
                    [12, 13, 1],
                    [13, 8, 1],
                    [10, 14, 1],
                    [12, 15, 1],
                    [15, 16, 2],
                    [15, 17, 1],
                    [5, 18, 1],
                    [18, 19, 1],
                    [19, 20, 1],
                    [20, 21, 1],
                    [21, 22, 1],
                ],
            ),
        );
        return specs;
    }

    private static buildPharma(): ICompactMoleculeSpec[] {
        return [
            MoleculeCatalog.make(
                "caffeine",
                "Caffeine",
                "C8H10N4O2",
                "Cn1cnc2c1c(=O)n(C)c(=O)n2C",
                "pharma",
                ["drug", "stimulant"],
                ["N", "C", "N", "C", "C", "C", "O", "O", "N", "C", "N", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [4, 5, 1],
                    [5, 0, 1],
                    [1, 6, 2],
                    [5, 7, 2],
                    [3, 10, 1],
                    [10, 9, 2],
                    [9, 8, 1],
                    [8, 4, 1],
                    [0, 11, 1],
                    [2, 12, 1],
                    [8, 13, 1],
                ],
                false,
                "InChI=1S/C8H10N4O2/c1-10-4-9-6-5(10)7(13)12(3)8(14)11(6)2/h4H,1-3H3",
            ),
            MoleculeCatalog.make(
                "ibuprofen",
                "Ibuprofen",
                "C13H18O2",
                "CC(C)CC1=CC=C(C=C1)C(C)C(O)=O",
                "pharma",
                ["drug"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "O", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                    [3, 10, 1],
                    [10, 11, 1],
                    [10, 12, 1],
                    [12, 13, 2],
                    [12, 14, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acetaminophen",
                "Acetaminophen",
                "C8H9NO2",
                "CC(=O)NC1=CC=C(O)C=C1",
                "pharma",
                ["drug"],
                ["C", "C", "C", "C", "C", "C", "O", "N", "C", "O", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [3, 7, 1],
                    [7, 8, 1],
                    [8, 9, 2],
                    [8, 10, 1],
                ],
            ),
            MoleculeCatalog.make(
                "naproxen",
                "Naproxen",
                "C14H14O3",
                "COC1=CC2=C(C=C1)C=C(C=C2)C(C)C(O)=O",
                "pharma",
                ["drug", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 0, 4],
                    [4, 9, 4],
                    [6, 10, 1],
                    [10, 11, 1],
                    [2, 12, 1],
                    [12, 13, 1],
                    [12, 14, 1],
                    [14, 15, 2],
                    [14, 16, 1],
                ],
            ),
            MoleculeCatalog.make(
                "penicillin-g",
                "Penicillin G",
                "C16H18N2O4S",
                "CC1(C(N2C(S1)C(C2=O)NC(=O)CC3=CC=CC=C3)C(O)=O)C",
                "pharma",
                ["drug", "antibiotic"],
                [
                    "S",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "N",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 0, 1],
                    [3, 6, 1],
                    [6, 5, 1],
                    [5, 4, 1],
                    [6, 22, 2],
                    [1, 7, 1],
                    [1, 8, 1],
                    [2, 9, 1],
                    [9, 10, 2],
                    [9, 11, 1],
                    [5, 12, 1],
                    [12, 13, 1],
                    [13, 14, 2],
                    [13, 15, 1],
                    [15, 16, 1],
                    [16, 17, 4],
                    [17, 18, 4],
                    [18, 19, 4],
                    [19, 20, 4],
                    [20, 21, 4],
                    [21, 16, 4],
                ],
            ),
            MoleculeCatalog.make(
                "amoxicillin",
                "Amoxicillin",
                "C16H19N3O5S",
                "CC1(C(N2C(S1)C(C2=O)NC(=O)C(N)C3=CC=C(O)C=C3)C(O)=O)C",
                "pharma",
                ["drug", "antibiotic"],
                [
                    "S",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "N",
                    "C",
                    "O",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 0, 1],
                    [3, 6, 1],
                    [6, 5, 1],
                    [5, 4, 1],
                    [6, 24, 2],
                    [1, 7, 1],
                    [1, 8, 1],
                    [2, 9, 1],
                    [9, 10, 2],
                    [9, 11, 1],
                    [5, 12, 1],
                    [12, 13, 1],
                    [13, 14, 2],
                    [13, 15, 1],
                    [15, 16, 1],
                    [15, 17, 1],
                    [16, 18, 4],
                    [18, 19, 4],
                    [19, 20, 4],
                    [20, 21, 4],
                    [21, 22, 4],
                    [22, 16, 4],
                    [19, 23, 1],
                ],
            ),
            MoleculeCatalog.make(
                "tetracycline",
                "Tetracycline",
                "C22H24N2O8",
                "CN(C)C1C(O)=C(C(=O)C2(C)O)CC3CC4=C(O)C=CC=C4C(=O)C32O",
                "pharma",
                ["drug", "antibiotic", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "O",
                    "O",
                    "O",
                    "O",
                    "O",
                    "O",
                    "O",
                    "C",
                    "O",
                    "N",
                    "C",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 0, 2],
                    [2, 6, 1],
                    [6, 7, 1],
                    [7, 8, 2],
                    [8, 9, 1],
                    [9, 3, 2],
                    [8, 10, 1],
                    [10, 11, 1],
                    [11, 12, 1],
                    [12, 13, 1],
                    [13, 7, 1],
                    [13, 14, 4],
                    [14, 15, 4],
                    [15, 16, 4],
                    [16, 17, 4],
                    [17, 12, 4],
                    [1, 18, 1],
                    [18, 19, 1],
                    [18, 20, 1],
                    [0, 21, 1],
                    [2, 22, 1],
                    [6, 23, 1],
                    [12, 24, 1],
                    [15, 25, 1],
                    [4, 26, 2],
                    [11, 27, 2],
                    [5, 28, 1],
                    [28, 29, 2],
                    [28, 30, 1],
                    [6, 31, 1],
                ],
            ),
            MoleculeCatalog.make(
                "ciprofloxacin",
                "Ciprofloxacin",
                "C17H18FN3O3",
                "C1CC1N2C=C(C(=O)C3=CC(F)=C(N4CCNCC4)C=C32)C(O)=O",
                "pharma",
                ["drug", "antibiotic", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "F",
                    "N",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "O",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 8, 2],
                    [8, 9, 1],
                    [9, 4, 1],
                    [2, 10, 1],
                    [1, 11, 1],
                    [11, 12, 1],
                    [12, 13, 1],
                    [13, 14, 1],
                    [14, 15, 1],
                    [15, 16, 1],
                    [16, 11, 1],
                    [8, 17, 1],
                    [17, 18, 2],
                    [17, 19, 1],
                    [6, 20, 1],
                    [20, 21, 1],
                    [21, 22, 1],
                    [22, 20, 1],
                    [9, 23, 2],
                ],
            ),
            MoleculeCatalog.make(
                "sulfamethoxazole",
                "Sulfamethoxazole",
                "C10H11N3O3S",
                "CC1=CC(=NO1)NS(=O)(=O)C2=CC=C(N)C=C2",
                "pharma",
                ["drug", "antibiotic", "aromatic"],
                [
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "S",
                    "O",
                    "O",
                    "N",
                    "O",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 6, 4],
                    [6, 1, 4],
                    [4, 7, 1],
                    [7, 8, 2],
                    [7, 9, 2],
                    [7, 10, 1],
                    [10, 13, 1],
                    [13, 12, 2],
                    [12, 11, 1],
                    [11, 15, 1],
                    [15, 14, 2],
                    [14, 13, 1],
                    [15, 16, 1],
                ],
            ),
            MoleculeCatalog.make(
                "fluoxetine",
                "Fluoxetine",
                "C17H18F3NO",
                "CNCCC(OC1=CC=CC=C1)C2=CC=C(C=C2)C(F)(F)F",
                "pharma",
                ["drug"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "F",
                    "F",
                    "F",
                    "C",
                    "C",
                    "N",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [2, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 13, 4],
                    [13, 8, 4],
                    [11, 14, 1],
                    [14, 15, 1],
                    [14, 16, 1],
                    [14, 17, 1],
                    [7, 18, 1],
                    [18, 19, 1],
                    [19, 20, 1],
                    [20, 21, 1],
                ],
            ),
            MoleculeCatalog.make(
                "sertraline",
                "Sertraline",
                "C17H17Cl2N",
                "CNC1CCC(C2=C1C=CC=C2)C3=CC(Cl)=C(Cl)C=C3",
                "pharma",
                ["drug", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "Cl",
                    "Cl",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 1],
                    [9, 5, 1],
                    [6, 10, 1],
                    [10, 11, 1],
                    [8, 12, 1],
                    [12, 13, 4],
                    [13, 14, 4],
                    [14, 15, 4],
                    [15, 16, 4],
                    [16, 17, 4],
                    [17, 12, 4],
                    [15, 18, 1],
                    [16, 19, 1],
                ],
            ),
            MoleculeCatalog.make(
                "diazepam",
                "Diazepam",
                "C16H13ClN2O",
                "CN1C(=O)CN=C(C2=CC=CC=C2)C3=CC(Cl)=CC=C13",
                "pharma",
                ["drug", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "N",
                    "C",
                    "Cl",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 1],
                    [9, 10, 2],
                    [10, 5, 1],
                    [1, 11, 1],
                    [10, 12, 1],
                    [12, 13, 4],
                    [13, 14, 4],
                    [14, 15, 4],
                    [15, 16, 4],
                    [16, 17, 4],
                    [17, 12, 4],
                    [6, 18, 1],
                    [7, 19, 2],
                ],
            ),
            MoleculeCatalog.make(
                "amphetamine",
                "Amphetamine",
                "C9H13N",
                "CC(N)CC1=CC=CC=C1",
                "pharma",
                ["drug", "stimulant"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                ],
            ),
            MoleculeCatalog.make(
                "mdma",
                "MDMA",
                "C11H15NO2",
                "CC(NC)CC1=CC2=C(OCO2)C=C1",
                "pharma",
                ["drug", "stimulant"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "C", "C", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [6, 8, 1],
                    [8, 7, 1],
                    [7, 1, 1],
                    [3, 9, 1],
                    [9, 10, 1],
                    [10, 11, 1],
                    [10, 12, 1],
                    [12, 13, 1],
                ],
            ),
            MoleculeCatalog.make(
                "morphine",
                "Morphine",
                "C17H19NO3",
                "CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O",
                "pharma",
                ["drug", "natural"],
                [
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 1, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 2],
                    [9, 4, 1],
                    [9, 10, 1],
                    [10, 11, 2],
                    [11, 12, 1],
                    [12, 13, 2],
                    [13, 8, 1],
                    [10, 15, 1],
                    [15, 16, 1],
                    [16, 4, 1],
                    [16, 17, 1],
                    [17, 18, 1],
                    [18, 19, 2],
                    [19, 5, 1],
                    [11, 14, 1],
                    [17, 20, 1],
                ],
            ),
            MoleculeCatalog.make(
                "codeine",
                "Codeine",
                "C18H21NO3",
                "CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(C=C4)O",
                "pharma",
                ["drug", "natural"],
                [
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                ],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 1, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 2],
                    [9, 4, 1],
                    [9, 10, 1],
                    [10, 11, 2],
                    [11, 12, 1],
                    [12, 13, 2],
                    [13, 8, 1],
                    [10, 15, 1],
                    [15, 16, 1],
                    [16, 4, 1],
                    [16, 17, 1],
                    [17, 18, 1],
                    [18, 19, 2],
                    [19, 5, 1],
                    [11, 14, 1],
                    [14, 21, 1],
                    [17, 20, 1],
                ],
            ),
            MoleculeCatalog.smilesDriven(
                "oxycodone",
                "Oxycodone",
                "C18H21NO4",
                "CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O",
                "pharma",
                ["drug", "natural"],
            ),
            MoleculeCatalog.smilesDriven(
                "fentanyl",
                "Fentanyl",
                "C22H28N2O",
                "CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3",
                "pharma",
                ["drug"],
            ),
            MoleculeCatalog.smilesDriven(
                "methadone",
                "Methadone",
                "C21H27NO",
                "CCC(=O)C(CC(C)N(C)C)(C1=CC=CC=C1)C2=CC=CC=C2",
                "pharma",
                ["drug"],
            ),
            MoleculeCatalog.smilesDriven(
                "psilocybin",
                "Psilocybin",
                "C12H17N2O4P",
                "CN(C)CCC1=CNC2=C1C(=CC=C2)OP(=O)(O)O",
                "pharma",
                ["drug", "natural"],
            ),
            MoleculeCatalog.smilesDriven(
                "lsd",
                "LSD",
                "C20H25N3O",
                "CCN(CC)C(=O)C1CN(C2CC3=CNC4=CC=CC(=C34)C2=C1)C",
                "pharma",
                ["drug"],
            ),
            MoleculeCatalog.smilesDriven(
                "ketamine",
                "Ketamine",
                "C13H16ClNO",
                "CNC1(CCCCC1=O)C2=CC=CC=C2Cl",
                "pharma",
                ["drug"],
            ),
            MoleculeCatalog.make(
                "propofol",
                "Propofol",
                "C12H18O",
                "CC(C)C1=C(O)C(=CC=C1)C(C)C",
                "pharma",
                ["drug"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [6, 7, 1],
                    [6, 8, 1],
                    [2, 9, 1],
                    [9, 10, 1],
                    [9, 11, 1],
                    [1, 12, 1],
                ],
            ),
            MoleculeCatalog.smilesDriven(
                "warfarin",
                "Warfarin",
                "C19H16O4",
                "CC(=O)CC(C1=CC=CC=C1)C2=C(C3=CC=CC=C3OC2=O)O",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.make(
                "metformin",
                "Metformin",
                "C4H11N5",
                "CN(C)C(=N)NC(=N)N",
                "pharma",
                ["drug"],
                ["N", "C", "N", "N", "C", "N", "N", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [3, 4, 1],
                    [4, 5, 2],
                    [4, 6, 1],
                    [0, 7, 1],
                    [0, 8, 1],
                ],
            ),
            MoleculeCatalog.smilesDriven(
                "atorvastatin",
                "Atorvastatin",
                "C33H35FN2O5",
                "CC(C)C1=C(C(=C(N1CCC(CC(CC(=O)O)O)O)C2=CC=C(C=C2)F)C3=CC=CC=C3)C(=O)NC4=CC=CC=C4",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.smilesDriven(
                "omeprazole",
                "Omeprazole",
                "C17H19N3O3S",
                "CC1=CN=C(C(=C1OC)C)CS(=O)C2=NC3=C(N2)C=C(C=C3)OC",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.make(
                "diphenhydramine",
                "Diphenhydramine",
                "C17H21NO",
                "CN(C)CCOC(C1=CC=CC=C1)C2=CC=CC=C2",
                "pharma",
                ["drug"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 9, 4],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 6, 4],
                    [0, 12, 1],
                    [6, 12, 1],
                    [12, 13, 1],
                    [13, 14, 1],
                    [14, 15, 1],
                    [15, 16, 1],
                    [16, 17, 1],
                    [16, 18, 1],
                ],
            ),
            MoleculeCatalog.smilesDriven(
                "loratadine",
                "Loratadine",
                "C22H23ClN2O2",
                "CCOC(=O)N1CCC(=C2C3=C(CCC4=C2N=CC=C4)C=C(C=C3)Cl)CC1",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.smilesDriven(
                "sildenafil",
                "Sildenafil",
                "C22H30N6O4S",
                "CCCC1=NN(C2=C1N=C(NC2=O)C3=C(C=CC(=C3)S(=O)(=O)N4CCN(CC4)C)OCC)C",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.smilesDriven(
                "methylphenidate",
                "Methylphenidate",
                "C14H19NO2",
                "COC(=O)C(C1CCCCN1)C2=CC=CC=C2",
                "pharma",
                ["drug"],
            ),
            MoleculeCatalog.smilesDriven(
                "salbutamol",
                "Salbutamol",
                "C13H21NO3",
                "CC(C)(C)NCC(C1=CC(=C(C=C1)O)CO)O",
                "pharma",
                ["drug", "aromatic"],
            ),
            MoleculeCatalog.make(
                "lidocaine",
                "Lidocaine",
                "C14H22N2O",
                "CCN(CC)CC(=O)NC1=C(C)C=CC=C1C",
                "pharma",
                ["drug"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "N",
                    "C",
                    "C",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [1, 6, 1],
                    [5, 7, 1],
                    [0, 8, 1],
                    [8, 9, 1],
                    [9, 10, 2],
                    [9, 11, 1],
                    [11, 12, 1],
                    [12, 13, 1],
                    [12, 14, 1],
                    [12, 15, 1],
                    [15, 16, 1],
                ],
            ),
            MoleculeCatalog.smilesDriven(
                "tramadol",
                "Tramadol",
                "C16H25NO2",
                "CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O",
                "pharma",
                ["drug"],
            ),
        ];
    }

    private static buildNeuro(): ICompactMoleculeSpec[] {
        const pool = [...MoleculeCatalog.buildAminoAcids(), ...MoleculeCatalog.buildLipids()];
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "gaba"),
                "gaba-neuro",
                "GABA",
                "neuro",
                ["neuro", "amino"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "glutamate"),
                "glutamate-neuro",
                "Glutamate",
                "neuro",
                ["neuro", "amino"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "cortisol"),
                "cortisol-neuro",
                "Cortisol",
                "neuro",
                ["neuro", "hormone", "steroid"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "testosterone"),
                "testosterone-neuro",
                "Testosterone",
                "neuro",
                ["neuro", "hormone", "steroid"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "estradiol"),
                "estrogen",
                "Estrogen (Estradiol)",
                "neuro",
                ["neuro", "hormone", "steroid"],
            ),
            MoleculeCatalog.make(
                "dopamine",
                "Dopamine",
                "C8H11NO2",
                "NCCC1=CC(O)=C(O)C=C1",
                "neuro",
                ["neuro"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [3, 6, 1],
                    [4, 7, 1],
                    [0, 8, 1],
                    [8, 9, 1],
                    [9, 10, 1],
                ],
            ),
            MoleculeCatalog.make(
                "serotonin",
                "Serotonin",
                "C10H12N2O",
                "NCCC1=CNC2=C1C=C(O)C=C2",
                "neuro",
                ["neuro"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "N", "C", "C", "N", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 5, 4],
                    [2, 12, 1],
                    [6, 9, 1],
                    [9, 10, 1],
                    [10, 11, 1],
                ],
                false,
                "",
                [],
                [[8, 1]],
            ),
            MoleculeCatalog.make(
                "adrenaline",
                "Adrenaline",
                "C9H13NO3",
                "CNCC(O)C1=CC(O)=C(O)C=C1",
                "neuro",
                ["neuro", "hormone"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "O", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [3, 6, 1],
                    [4, 7, 1],
                    [0, 8, 1],
                    [8, 9, 1],
                    [8, 10, 1],
                    [10, 11, 1],
                    [11, 12, 1],
                ],
            ),
            MoleculeCatalog.make(
                "noradrenaline",
                "Noradrenaline",
                "C8H11NO3",
                "NCC(O)C1=CC(O)=C(O)C=C1",
                "neuro",
                ["neuro", "hormone"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "O", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [3, 6, 1],
                    [4, 7, 1],
                    [0, 8, 1],
                    [8, 9, 1],
                    [8, 10, 1],
                    [10, 11, 1],
                ],
            ),
            MoleculeCatalog.make(
                "acetylcholine",
                "Acetylcholine",
                "C7H16NO2",
                "CC(=O)OCC[N+](C)(C)C",
                "neuro",
                ["neuro"],
                ["N", "C", "C", "C", "C", "C", "O", "C", "O", "C"],
                [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [0, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 8, 2],
                    [7, 9, 1],
                ],
                false,
                "",
                [[0, 1]],
            ),
            MoleculeCatalog.make(
                "histamine",
                "Histamine",
                "C5H9N3",
                "NCCC1=CN=CN1",
                "neuro",
                ["neuro"],
                ["C", "N", "C", "N", "C", "C", "C", "N"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 0, 4],
                    [0, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                ],
                false,
                "",
                [],
                [[1, 1]],
            ),
            MoleculeCatalog.make(
                "melatonin",
                "Melatonin",
                "C13H16N2O2",
                "COC1=CC2=C(C=C1)NC=C2CCNC(C)=O",
                "neuro",
                ["neuro", "hormone"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "N",
                    "O",
                    "C",
                    "C",
                    "C",
                    "N",
                    "C",
                    "O",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 5, 4],
                    [1, 9, 1],
                    [9, 10, 1],
                    [6, 11, 1],
                    [11, 12, 1],
                    [12, 13, 1],
                    [13, 14, 1],
                    [14, 15, 2],
                    [14, 16, 1],
                ],
                false,
                "",
                [],
                [[8, 1]],
            ),
            MoleculeCatalog.proteinEntry(
                "oxytocin",
                "Oxytocin",
                "SEQ:CYIQNCPLG",
                "neuro",
                MoleculeCatalog.buildProtein(["CYIQNCPLG"], [[0, 0, 0, 5]], [true]),
                ["neuro", "hormone", "peptide"],
            ),
            MoleculeCatalog.proteinEntry(
                "vasopressin",
                "Vasopressin",
                "SEQ:CYFQNCPRG",
                "neuro",
                MoleculeCatalog.buildProtein(["CYFQNCPRG"], [[0, 0, 0, 5]], [true]),
                ["neuro", "hormone", "peptide"],
            ),
            MoleculeCatalog.smilesDriven(
                "thyroxine",
                "Thyroxine",
                "C15H11I4NO4",
                "NC(Cc1cc(I)c(Oc2cc(I)c(O)c(I)c2)c(I)c1)C(O)=O",
                "neuro",
                ["neuro", "hormone"],
            ),
        ];
        const adenosineNeuro = MoleculeCatalog.buildNucleoside(
            MoleculeCatalog.adeninePart(true),
            MoleculeCatalog.ribosePart(),
        );
        const adenosineFormula = MoleculeCatalog.formulaOf(
            adenosineNeuro.heavy,
            adenosineNeuro.bonds,
            [],
            adenosineNeuro.extraH,
        );
        specs.push(
            MoleculeCatalog.make(
                "adenosine",
                "Adenosine",
                adenosineFormula,
                "Nc1ncnc2n(cnc12)C1OC(CO)C(O)C1O",
                "neuro",
                ["neuro"],
                adenosineNeuro.heavy,
                adenosineNeuro.bonds,
                false,
                "",
                [],
                adenosineNeuro.extraH,
            ),
        );
        const anandamideHeavy: string[] = [];
        const anandamideBonds: CompactBond[] = [];
        for (let i = 0; i < 19; i++) {
            anandamideHeavy.push("C");
        }
        const anDoubles = new Set([4, 7, 10, 13]);
        for (let i = 0; i < 18; i++) {
            anandamideBonds.push(anDoubles.has(i) ? [i, i + 1, 2, "Z"] : [i, i + 1, 1]);
        }
        anandamideHeavy.push("C", "O", "N", "C", "C", "O");
        anandamideBonds.push(
            [18, 19, 1],
            [19, 20, 2],
            [19, 21, 1],
            [21, 22, 1],
            [22, 23, 1],
            [23, 24, 1],
        );
        const anandamideFormula = MoleculeCatalog.formulaOf(anandamideHeavy, anandamideBonds);
        specs.push(
            MoleculeCatalog.make(
                "anandamide",
                "Anandamide",
                anandamideFormula,
                "CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO",
                "neuro",
                ["neuro", "lipid"],
                anandamideHeavy,
                anandamideBonds,
            ),
        );
        return specs;
    }

    private static cloneSpec(
        base: ICompactMoleculeSpec,
        newId: string,
        name: string,
        category: MoleculeCategory,
        tags: string[],
    ): ICompactMoleculeSpec {
        return { ...base, id: newId, name, category, tags };
    }

    private static findSpec(pool: ICompactMoleculeSpec[], id: string): ICompactMoleculeSpec {
        const found = pool.find((s) => s.id === id);
        if (found === undefined) {
            throw new Error("unknown base molecule: " + id);
        }
        return found;
    }

    private static buildProtein(
        chains: ReadonlyArray<string>,
        disulfides: ReadonlyArray<readonly [number, number, number, number]>,
        cAmides: ReadonlyArray<boolean>,
    ): { heavy: string[]; bonds: CompactBond[]; extraH: Array<readonly [number, number]> } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const extraH: Array<readonly [number, number]> = [];
        const sulfurOf: number[][][] = [];
        for (let c = 0; c < chains.length; c++) {
            const seq = chains[c];
            const chainSulfur: number[][] = [];
            sulfurOf.push(chainSulfur);
            let prevC = -1;
            for (let r = 0; r < seq.length; r++) {
                const code = seq[r];
                const side = MoleculeCatalog.residueSide(code);
                const nIdx = heavy.length;
                heavy.push("N");
                const caIdx = heavy.length;
                heavy.push("C");
                const cIdx = heavy.length;
                heavy.push("C");
                const oIdx = heavy.length;
                heavy.push("O");
                bonds.push([nIdx, caIdx, 1], [caIdx, cIdx, 1], [cIdx, oIdx, 2]);
                if (prevC >= 0) {
                    bonds.push([prevC, nIdx, 1]);
                }
                const isLast = r === seq.length - 1;
                if (isLast && (cAmides[c] ?? false)) {
                    const n2 = heavy.length;
                    heavy.push("N");
                    bonds.push([cIdx, n2, 1]);
                } else if (isLast) {
                    const o2 = heavy.length;
                    heavy.push("O");
                    bonds.push([cIdx, o2, 1]);
                }
                const sideBase = heavy.length;
                const residueSulfur: number[] = [];
                chainSulfur.push(residueSulfur);
                for (let s = 0; s < side.heavy.length; s++) {
                    const global = heavy.length;
                    heavy.push(side.heavy[s]);
                    if (side.heavy[s] === "S") {
                        residueSulfur.push(global);
                    }
                }
                for (const b of side.bonds) {
                    const a = b[0] === -1 ? caIdx : b[0] === -2 ? nIdx : b[0] + sideBase;
                    const d = b[1] === -1 ? caIdx : b[1] === -2 ? nIdx : b[1] + sideBase;
                    bonds.push([a, d, b[2]]);
                }
                for (const h of side.extraH) {
                    extraH.push([h + sideBase, 1]);
                }
                prevC = cIdx;
            }
        }
        for (const link of disulfides) {
            const s1 = sulfurOf[link[0]][link[1]][0];
            const s2 = sulfurOf[link[2]][link[3]][0];
            bonds.push([s1, s2, 1]);
        }
        return { heavy, bonds, extraH };
    }

    private static proteinEntry(
        id: string,
        name: string,
        smiles: string,
        category: MoleculeCategory,
        graph: { heavy: string[]; bonds: CompactBond[]; extraH: Array<readonly [number, number]> },
        tags: string[],
        warn: boolean = false,
    ): ICompactMoleculeSpec {
        const formula = MoleculeCatalog.formulaOf(graph.heavy, graph.bonds, [], graph.extraH);
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            category,
            tags,
            graph.heavy,
            graph.bonds,
            warn,
            "",
            [],
            graph.extraH,
        );
    }

    private static buildPolymers(): ICompactMoleculeSpec[] {
        const pool = [...MoleculeCatalog.buildSugars()];
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "cellulose-fragment"),
                "cellulose-material",
                "Cellulose",
                "polymers",
                ["polymer", "natural"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "chitin-fragment"),
                "chitin-material",
                "Chitin",
                "polymers",
                ["polymer", "natural"],
            ),
        ];
        const tile = (
            id: string,
            name: string,
            smiles: string,
            unitHeavy: string[],
            unitBonds: CompactBond[],
            linkFrom: number,
            linkTo: number,
            degree: number,
            tags: string[] = [],
        ): void => {
            const graph = MoleculeCatalog.tileRepeat(
                unitHeavy,
                unitBonds,
                linkFrom,
                linkTo,
                degree,
            );
            const formula = MoleculeCatalog.formulaOf(graph.heavy, graph.bonds);
            specs.push(
                MoleculeCatalog.make(
                    id,
                    name,
                    formula,
                    smiles,
                    "polymers",
                    ["polymer", ...tags],
                    graph.heavy,
                    graph.bonds,
                ),
            );
        };
        tile("polyethylene", "Polyethylene", "CCCCCCCCCC", ["C", "C"], [[0, 1, 1]], 1, 0, 10, [
            "plastic",
        ]);
        tile(
            "polypropylene",
            "Polypropylene",
            "CC(C)CCCC(C)C",
            ["C", "C", "C"],
            [
                [0, 1, 1],
                [1, 2, 1],
            ],
            1,
            0,
            8,
            ["plastic"],
        );
        tile(
            "polystyrene",
            "Polystyrene",
            "CC(C1=CC=CC=C1)CC",
            ["C", "C", "C", "C", "C", "C", "C", "C"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 6, 4],
                [6, 7, 4],
                [7, 2, 4],
            ],
            1,
            0,
            6,
            ["plastic", "aromatic"],
        );
        tile(
            "pvc",
            "PVC",
            "CC(Cl)CC(Cl)CC",
            ["C", "C", "Cl"],
            [
                [0, 1, 1],
                [1, 2, 1],
            ],
            1,
            0,
            10,
            ["plastic"],
        );
        tile(
            "ptfe",
            "PTFE (Teflon)",
            "FC(F)(F)C(F)(F)C",
            ["C", "C", "F", "F", "F", "F"],
            [
                [0, 1, 1],
                [0, 2, 1],
                [0, 3, 1],
                [1, 4, 1],
                [1, 5, 1],
            ],
            1,
            0,
            8,
            ["plastic"],
        );
        tile(
            "nylon-66",
            "Nylon-6,6",
            "NCCCCCCNC(=O)CCCC(=O)",
            ["N", "C", "C", "C", "C", "C", "C", "C", "N", "C", "O", "C", "C", "C", "C", "C", "O"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 6, 1],
                [6, 7, 1],
                [7, 8, 1],
                [8, 9, 2],
                [8, 10, 1],
                [10, 11, 1],
                [11, 12, 1],
                [12, 13, 1],
                [13, 14, 1],
                [14, 15, 1],
                [15, 16, 2],
            ],
            15,
            0,
            4,
            ["fiber"],
        );
        tile(
            "nylon-6",
            "Nylon-6",
            "NCCCCCC(=O)",
            ["N", "C", "C", "C", "C", "C", "C", "O"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 1],
                [5, 6, 1],
                [6, 7, 2],
            ],
            6,
            0,
            6,
            ["fiber"],
        );
        tile(
            "kevlar",
            "Kevlar",
            "NC1=CC=C(C=C1)NC(=O)C2=CC=C(C=C2)C(=O)",
            [
                "N",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "N",
                "C",
                "O",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "O",
            ],
            [
                [0, 1, 1],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 6, 4],
                [6, 1, 4],
                [6, 7, 1],
                [7, 8, 1],
                [8, 9, 2],
                [8, 10, 1],
                [10, 11, 4],
                [11, 12, 4],
                [12, 13, 4],
                [13, 14, 4],
                [14, 15, 4],
                [15, 10, 4],
                [15, 16, 1],
                [16, 17, 2],
            ],
            16,
            0,
            3,
            ["fiber", "aromatic"],
        );
        tile(
            "pet",
            "PET",
            "OCCOC(=O)C1=CC=C(C=C1)C(=O)",
            ["O", "C", "C", "O", "C", "O", "C", "C", "C", "C", "C", "C", "C", "O"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 1],
                [3, 4, 1],
                [4, 5, 2],
                [4, 6, 1],
                [6, 7, 4],
                [7, 8, 4],
                [8, 9, 4],
                [9, 10, 4],
                [10, 11, 4],
                [11, 6, 4],
                [11, 12, 1],
                [12, 13, 2],
            ],
            12,
            0,
            4,
            ["plastic", "aromatic"],
        );
        tile(
            "polycarbonate",
            "Polycarbonate",
            "OC1=CC=C(C=C1)C(C)(C)C2=CC=C(O)C=C2",
            [
                "O",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "O",
                "C",
                "O",
            ],
            [
                [0, 1, 1],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 6, 4],
                [6, 1, 4],
                [3, 7, 1],
                [7, 8, 1],
                [7, 9, 1],
                [7, 10, 1],
                [10, 11, 4],
                [11, 12, 4],
                [12, 13, 4],
                [13, 14, 4],
                [14, 15, 4],
                [15, 10, 4],
                [15, 16, 1],
                [16, 17, 1],
                [17, 18, 2],
            ],
            17,
            0,
            3,
            ["plastic", "aromatic"],
        );
        tile(
            "polyurethane",
            "Polyurethane",
            "NC1=CC=C(CC2=CC=C(NC(=O)OCCO)C=C2)C=C1",
            [
                "N",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "C",
                "N",
                "C",
                "O",
                "O",
                "C",
                "C",
                "O",
                "C",
                "O",
            ],
            [
                [0, 1, 1],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 6, 4],
                [6, 1, 4],
                [3, 7, 1],
                [7, 8, 1],
                [8, 9, 4],
                [9, 10, 4],
                [10, 11, 4],
                [11, 12, 4],
                [12, 13, 4],
                [13, 8, 4],
                [12, 14, 1],
                [14, 15, 1],
                [15, 16, 2],
                [15, 17, 1],
                [17, 18, 1],
                [18, 19, 1],
                [19, 20, 1],
                [20, 21, 1],
                [21, 22, 2],
            ],
            21,
            0,
            2,
            ["plastic", "aromatic"],
        );
        tile(
            "bakelite",
            "Bakelite (Novolak)",
            "OCC1=CC=C(O)C=C1",
            ["C", "C", "C", "C", "C", "C", "C", "O"],
            [
                [0, 1, 1],
                [1, 2, 4],
                [2, 3, 4],
                [3, 4, 4],
                [4, 5, 4],
                [5, 6, 4],
                [6, 1, 4],
                [3, 7, 1],
            ],
            0,
            4,
            5,
            ["plastic", "aromatic"],
        );
        tile(
            "pdms",
            "PDMS (Silicone)",
            "C[Si](C)(O)C",
            ["Si", "C", "C", "O"],
            [
                [0, 1, 1],
                [0, 2, 1],
                [0, 3, 1],
            ],
            3,
            0,
            8,
            ["plastic"],
        );
        tile(
            "pmma",
            "PMMA (Acrylic)",
            "CC(C)(C(=O)OC)C",
            ["C", "C", "C", "C", "O", "O", "C"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [1, 3, 1],
                [3, 4, 2],
                [3, 5, 1],
                [5, 6, 1],
            ],
            1,
            0,
            6,
            ["plastic"],
        );
        tile(
            "polyacrylonitrile",
            "Polyacrylonitrile",
            "CCC#N",
            ["C", "C", "C", "N"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [2, 3, 3],
            ],
            1,
            0,
            8,
            ["fiber"],
        );
        tile(
            "pla",
            "PLA",
            "CC(C(=O)O)O",
            ["O", "C", "C", "C", "O"],
            [
                [0, 1, 1],
                [1, 2, 1],
                [1, 3, 1],
                [3, 4, 2],
            ],
            3,
            0,
            8,
            ["plastic"],
        );
        tile("polyacetylene", "Polyacetylene", "C=CC=C", ["C", "C"], [[0, 1, 2]], 1, 0, 10, [
            "plastic",
        ]);
        const ligninUnits: Array<{ heavy: string[]; bonds: CompactBond[] }> = [];
        for (let u = 0; u < 3; u++) {
            ligninUnits.push({
                heavy: ["C", "C", "C", "C", "C", "C", "O", "O", "C", "C", "C", "C", "O"],
                bonds: [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [1, 6, 1],
                    [2, 7, 1],
                    [7, 8, 1],
                    [0, 9, 1],
                    [9, 10, 2],
                    [10, 11, 1],
                    [11, 12, 1],
                ],
            });
        }
        const lignin = MoleculeCatalog.mergeParts(ligninUnits, [
            [0, 11, 1, 6],
            [1, 11, 2, 6],
        ]);
        const ligninFormula = MoleculeCatalog.formulaOf(lignin.heavy, lignin.bonds);
        specs.push(
            MoleculeCatalog.make(
                "lignin-fragment",
                "Lignin Fragment",
                ligninFormula,
                "COC1=C(O)C=CC(=C1)CCO",
                "polymers",
                ["polymer", "natural"],
                lignin.heavy,
                lignin.bonds,
            ),
        );
        return specs;
    }

    private static tileRepeat(
        unitHeavy: ReadonlyArray<string>,
        unitBonds: ReadonlyArray<CompactBond>,
        linkFrom: number,
        linkTo: number,
        degree: number,
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        for (let k = 0; k < degree; k++) {
            const offset = heavy.length;
            heavy.push(...unitHeavy);
            for (const b of unitBonds) {
                bonds.push([b[0] + offset, b[1] + offset, b[2]]);
            }
            if (k > 0) {
                bonds.push([offset - unitHeavy.length + linkFrom, offset + linkTo, 1]);
            }
        }
        return { heavy, bonds };
    }

    private static buildExplosives(): ICompactMoleculeSpec[] {
        const nitro = (
            n: number,
        ): { heavy: string[]; bonds: CompactBond[]; charges: Array<readonly [number, number]> } => {
            void n;
            return { heavy: [], bonds: [], charges: [] };
        };
        void nitro;
        const no2 = (
            base: string[],
            baseBonds: CompactBond[],
            attachAt: number,
            startIdx: number,
        ): { heavy: string[]; bonds: CompactBond[]; charges: Array<readonly [number, number]> } => {
            const heavy = [...base];
            const bonds: CompactBond[] = [...baseBonds];
            const charges: Array<readonly [number, number]> = [];
            const nIdx = startIdx;
            heavy.push("N", "O", "O");
            bonds.push([attachAt, nIdx, 1], [nIdx, nIdx + 1, 2], [nIdx, nIdx + 2, 1]);
            charges.push([nIdx, 1], [nIdx + 2, -1]);
            return { heavy, bonds, charges };
        };
        const specs: ICompactMoleculeSpec[] = [];
        specs.push(
            MoleculeCatalog.make(
                "nitroglycerin",
                "Nitroglycerin",
                "C3H5N3O9",
                "C(C(CO[N+](=O)[O-])O[N+](=O)[O-])O[N+](=O)[O-]",
                "explosives",
                ["explosive"],
                ["C", "C", "C", "O", "O", "O", "N", "N", "N", "O", "O", "O", "O", "O", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [0, 3, 1],
                    [1, 4, 1],
                    [2, 5, 1],
                    [3, 6, 1],
                    [4, 7, 1],
                    [5, 8, 1],
                    [6, 9, 2],
                    [6, 10, 1],
                    [7, 11, 2],
                    [7, 12, 1],
                    [8, 13, 2],
                    [8, 14, 1],
                ],
                true,
                "",
                [
                    [6, 1],
                    [7, 1],
                    [8, 1],
                    [10, -1],
                    [12, -1],
                    [14, -1],
                ],
            ),
        );
        let tntHeavy = ["C", "C", "C", "C", "C", "C", "C"];
        let tntBonds: CompactBond[] = [
            [0, 1, 4],
            [1, 2, 4],
            [2, 3, 4],
            [3, 4, 4],
            [4, 5, 4],
            [5, 0, 4],
            [0, 6, 1],
        ];
        let tntCharges: Array<readonly [number, number]> = [];
        for (const pos of [1, 3, 5]) {
            const added = no2(tntHeavy, tntBonds, pos, tntHeavy.length);
            tntHeavy = added.heavy;
            tntBonds = added.bonds;
            tntCharges = tntCharges.concat(added.charges);
        }
        specs.push(
            MoleculeCatalog.make(
                "tnt",
                "TNT",
                "C7H5N3O6",
                "CC1=C(C=C(C=C1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]",
                "explosives",
                ["explosive", "aromatic"],
                tntHeavy,
                tntBonds,
                true,
                "",
                tntCharges,
            ),
        );
        const rdxHeavy = ["C", "N", "C", "N", "C", "N"];
        const rdxBonds: CompactBond[] = [
            [0, 1, 1],
            [1, 2, 1],
            [2, 3, 1],
            [3, 4, 1],
            [4, 5, 1],
            [5, 0, 1],
        ];
        let rdxH = [...rdxHeavy];
        let rdxB = [...rdxBonds];
        let rdxC: Array<readonly [number, number]> = [];
        for (const pos of [1, 3, 5]) {
            const added = no2(rdxH, rdxB, pos, rdxH.length);
            rdxH = added.heavy;
            rdxB = added.bonds;
            rdxC = rdxC.concat(added.charges);
        }
        specs.push(
            MoleculeCatalog.make(
                "rdx",
                "RDX",
                "C3H6N6O6",
                "C1N(CN(CN1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]",
                "explosives",
                ["explosive", "ring"],
                rdxH,
                rdxB,
                true,
                "",
                rdxC,
            ),
        );
        const petnHeavy = [
            "C",
            "C",
            "C",
            "C",
            "C",
            "O",
            "O",
            "O",
            "O",
            "N",
            "N",
            "N",
            "N",
            "O",
            "O",
            "O",
            "O",
            "O",
            "O",
            "O",
            "O",
        ];
        const petnBonds: CompactBond[] = [
            [0, 1, 1],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1],
            [1, 5, 1],
            [2, 6, 1],
            [3, 7, 1],
            [4, 8, 1],
            [5, 9, 1],
            [6, 10, 1],
            [7, 11, 1],
            [8, 12, 1],
            [9, 13, 2],
            [9, 14, 1],
            [10, 15, 2],
            [10, 16, 1],
            [11, 17, 2],
            [11, 18, 1],
            [12, 19, 2],
            [12, 20, 1],
        ];
        specs.push(
            MoleculeCatalog.make(
                "petn",
                "PETN",
                "C5H8N4O12",
                "C(C(CO[N+](=O)[O-])(CO[N+](=O)[O-])CO[N+](=O)[O-])O[N+](=O)[O-]",
                "explosives",
                ["explosive"],
                petnHeavy,
                petnBonds,
                true,
                "",
                [
                    [9, 1],
                    [10, 1],
                    [11, 1],
                    [12, 1],
                    [14, -1],
                    [16, -1],
                    [18, -1],
                    [20, -1],
                ],
            ),
        );
        const hmxHeavy = ["C", "N", "C", "N", "C", "N", "C", "N"];
        const hmxBonds: CompactBond[] = MoleculeCatalog.ringBonds(8);
        let hmxH = [...hmxHeavy];
        let hmxB = [...hmxBonds];
        let hmxC: Array<readonly [number, number]> = [];
        for (const pos of [1, 3, 5, 7]) {
            const added = no2(hmxH, hmxB, pos, hmxH.length);
            hmxH = added.heavy;
            hmxB = added.bonds;
            hmxC = hmxC.concat(added.charges);
        }
        specs.push(
            MoleculeCatalog.make(
                "hmx",
                "HMX",
                "C4H8N8O8",
                "C1N(CN(CN(CN1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]",
                "explosives",
                ["explosive", "ring"],
                hmxH,
                hmxB,
                true,
                "",
                hmxC,
            ),
        );
        const tatpHeavy = [
            "C",
            "O",
            "O",
            "C",
            "O",
            "O",
            "C",
            "O",
            "O",
            "C",
            "C",
            "C",
            "C",
            "C",
            "C",
        ];
        const tatpBonds: CompactBond[] = [
            ...MoleculeCatalog.ringBonds(9),
            [0, 9, 1],
            [0, 10, 1],
            [3, 11, 1],
            [3, 12, 1],
            [6, 13, 1],
            [6, 14, 1],
        ];
        specs.push(
            MoleculeCatalog.make(
                "tatp",
                "TATP",
                "C9H18O6",
                "CC1(C)OOC(C)(C)OOC(C)(C)O1",
                "explosives",
                ["explosive", "ring"],
                tatpHeavy,
                tatpBonds,
                true,
                "",
                [],
            ),
        );
        let picHeavy = ["C", "C", "C", "C", "C", "C", "O"];
        let picBonds: CompactBond[] = [
            [0, 1, 4],
            [1, 2, 4],
            [2, 3, 4],
            [3, 4, 4],
            [4, 5, 4],
            [5, 0, 4],
            [0, 6, 1],
        ];
        let picC: Array<readonly [number, number]> = [];
        for (const pos of [1, 3, 5]) {
            const added = no2(picHeavy, picBonds, pos, picHeavy.length);
            picHeavy = added.heavy;
            picBonds = added.bonds;
            picC = picC.concat(added.charges);
        }
        specs.push(
            MoleculeCatalog.make(
                "picric-acid",
                "Picric Acid",
                "C6H3N3O7",
                "OC1=C(C=C(C=C1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]",
                "explosives",
                ["explosive", "aromatic", "acid"],
                picHeavy,
                picBonds,
                true,
                "",
                picC,
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "ammonium-nitrate",
                "Ammonium Nitrate",
                "H4N2O3",
                "[NH4+].[N+](=O)([O-])[O-]",
                "explosives",
                ["explosive", "salt"],
                ["N", "N", "O", "O", "O"],
                [
                    [1, 2, 2],
                    [1, 3, 1],
                    [1, 4, 1],
                ],
                true,
                "",
                [
                    [0, 1],
                    [1, 1],
                    [3, -1],
                    [4, -1],
                ],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "sulfur-s8",
                "Sulfur (S8)",
                "S8",
                "S1SSSSSSS1",
                "explosives",
                ["ring"],
                ["S", "S", "S", "S", "S", "S", "S", "S"],
                MoleculeCatalog.ringBonds(8),
                true,
                "",
                [],
            ),
        );
        specs.push(
            MoleculeCatalog.make(
                "potassium-nitrate",
                "Potassium Nitrate",
                "KNO3",
                "[K+].[N+](=O)([O-])[O-]",
                "explosives",
                ["salt"],
                ["K", "N", "O", "O", "O"],
                [
                    [1, 2, 2],
                    [1, 3, 1],
                    [1, 4, 1],
                ],
                true,
                "",
                [
                    [0, 1],
                    [1, 1],
                    [3, -1],
                    [4, -1],
                ],
            ),
        );
        return specs;
    }

    private static buildToxins(): ICompactMoleculeSpec[] {
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.make(
                "sarin",
                "Sarin",
                "C4H10FO2P",
                "CC(C)OP(=O)(C)F",
                "toxins",
                ["toxin"],
                ["C", "P", "O", "F", "O", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [1, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [5, 7, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "vx",
                "VX",
                "C11H26NO2PS",
                "CCOP(=O)(C)SCCN(C(C)C)C(C)C",
                "toxins",
                ["toxin"],
                ["C", "P", "O", "S", "C", "C", "N", "C", "C", "C", "C", "C", "C", "O", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [1, 13, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                    [6, 10, 1],
                    [10, 11, 1],
                    [10, 12, 1],
                    [13, 14, 1],
                    [14, 15, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "tabun",
                "Tabun",
                "C5H11N2O2P",
                "CCOP(=O)(N(C)C)C#N",
                "toxins",
                ["toxin"],
                ["C", "C", "N", "P", "O", "C", "O", "C", "C", "N"],
                [
                    [0, 2, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [3, 5, 1],
                    [5, 9, 3],
                    [3, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "soman",
                "Soman",
                "C7H16FO2P",
                "CC(C)(C)C(C)OP(=O)(C)F",
                "toxins",
                ["toxin"],
                ["C", "P", "O", "F", "O", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [1, 3, 1],
                    [1, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                    [5, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                    [7, 10, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "hcn",
                "Hydrogen Cyanide",
                "CHN",
                "C#N",
                "toxins",
                ["toxin", "gas"],
                ["C", "N"],
                [[0, 1, 3]],
                true,
            ),
            MoleculeCatalog.make(
                "cyanogen-chloride",
                "Cyanogen Chloride",
                "CNCl",
                "ClC#N",
                "toxins",
                ["toxin", "gas"],
                ["C", "N", "Cl"],
                [
                    [0, 1, 3],
                    [0, 2, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "mustard-gas",
                "Mustard Gas",
                "C4H8Cl2S",
                "ClCCSCCCl",
                "toxins",
                ["toxin"],
                ["Cl", "C", "C", "S", "C", "C", "Cl"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "lewisite",
                "Lewisite",
                "C2H2AsCl3",
                "Cl/C=C/As(Cl)Cl",
                "toxins",
                ["toxin"],
                ["Cl", "C", "C", "As", "Cl", "Cl"],
                [
                    [0, 1, 1],
                    [1, 2, 2, "E"],
                    [2, 3, 1],
                    [3, 4, 1],
                    [3, 5, 1],
                ],
                true,
            ),
            MoleculeCatalog.make(
                "phosgene",
                "Phosgene",
                "CCl2O",
                "O=C(Cl)Cl",
                "toxins",
                ["toxin", "gas"],
                ["C", "O", "Cl", "Cl"],
                [
                    [0, 1, 2],
                    [0, 2, 1],
                    [0, 3, 1],
                ],
                true,
            ),
            MoleculeCatalog.proteinEntry(
                "ricin-fragment",
                "Ricin A-Chain Fragment",
                "SEQ:EAARFQ",
                "toxins",
                MoleculeCatalog.buildProtein(["EAARFQ"], [], [false]),
                ["toxin", "peptide"],
                true,
            ),
            MoleculeCatalog.proteinEntry(
                "botulinum-fragment",
                "Botulinum Fragment",
                "SEQ:HELIH",
                "toxins",
                MoleculeCatalog.buildProtein(["HELIH"], [], [false]),
                ["toxin", "peptide"],
                true,
            ),
            MoleculeCatalog.make(
                "carbon-monoxide",
                "Carbon Monoxide",
                "CO",
                "[C-]#[O+]",
                "toxins",
                ["toxin", "gas"],
                ["C", "O"],
                [[0, 1, 3]],
                true,
                "",
                [
                    [0, -1],
                    [1, 1],
                ],
                [[0, 0]],
            ),
        ];
        return specs;
    }

    private static fibonacciSphere(count: number): number[][] {
        const points: number[][] = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const radius = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = golden * i;
            points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
        }
        return points;
    }

    private static fullereneCage(pentagons: number): { heavy: string[]; bonds: CompactBond[] } {
        const centers = MoleculeCatalog.fibonacciSphere(pentagons);
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const ringAtom: number[][] = [];
        const radius = 3.4;
        for (let p = 0; p < pentagons; p++) {
            const c = centers[p];
            let up = Math.abs(c[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
            let t1 = [
                c[1] * up[2] - c[2] * up[1],
                c[2] * up[0] - c[0] * up[2],
                c[0] * up[1] - c[1] * up[0],
            ];
            const inv1 = 1 / (Math.sqrt(t1[0] * t1[0] + t1[1] * t1[1] + t1[2] * t1[2]) + 1e-9);
            t1 = [t1[0] * inv1, t1[1] * inv1, t1[2] * inv1];
            const t2 = [
                c[1] * t1[2] - c[2] * t1[1],
                c[2] * t1[0] - c[0] * t1[2],
                c[0] * t1[1] - c[1] * t1[0],
            ];
            void up;
            const ring: number[] = [];
            for (let k = 0; k < 5; k++) {
                const a = (k / 5) * Math.PI * 2;
                const px = c[0] * radius + (Math.cos(a) * t1[0] + Math.sin(a) * t2[0]) * 0.72;
                const py = c[1] * radius + (Math.cos(a) * t1[1] + Math.sin(a) * t2[1]) * 0.72;
                const pz = c[2] * radius + (Math.cos(a) * t1[2] + Math.sin(a) * t2[2]) * 0.72;
                void px;
                void py;
                void pz;
                ring.push(heavy.length);
                heavy.push("C");
            }
            for (let k = 0; k < 5; k++) {
                bonds.push([ring[k], ring[(k + 1) % 5], 4]);
            }
            ringAtom.push(ring);
        }
        const paired = new Set<number>();
        for (let p = 0; p < pentagons; p++) {
            if (paired.has(p)) {
                continue;
            }
            let best = -1;
            let bestD = Infinity;
            for (let q = 0; q < pentagons; q++) {
                if (q === p || paired.has(q)) {
                    continue;
                }
                const dx = centers[p][0] - centers[q][0];
                const dy = centers[p][1] - centers[q][1];
                const dz = centers[p][2] - centers[q][2];
                const d = dx * dx + dy * dy + dz * dz;
                if (d < bestD) {
                    bestD = d;
                    best = q;
                }
            }
            if (best < 0) {
                continue;
            }
            paired.add(p);
            paired.add(best);
            const usedB = new Set<number>();
            for (const a of ringAtom[p]) {
                let bk = -1;
                let bkD = Infinity;
                for (let k = 0; k < 5; k++) {
                    if (usedB.has(k)) {
                        continue;
                    }
                    const b = ringAtom[best][k];
                    const ax = (a * 7919) % 100;
                    void ax;
                    bkD = bkD + 0;
                    if (bk < 0) {
                        bk = k;
                    }
                }
                void bkD;
                if (bk >= 0) {
                    usedB.add(bk);
                    bonds.push([a, ringAtom[best][bk], 1]);
                }
            }
        }
        return { heavy, bonds };
    }

    private static nanotube(
        circumference: number,
        rows: number,
        stagger: number,
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const idx: number[][] = [];
        for (let j = 0; j < rows; j++) {
            const row: number[] = [];
            for (let i = 0; i < circumference; i++) {
                row.push(heavy.length);
                heavy.push("C");
            }
            idx.push(row);
        }
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < circumference; i++) {
                bonds.push([idx[j][i], idx[j][(i + 1) % circumference], 4]);
                if (j % 2 === 0 && j < rows - 1) {
                    const ni = (i + stagger) % circumference;
                    bonds.push([idx[j][i], idx[j + 1][ni], 1]);
                }
            }
        }
        return { heavy, bonds };
    }

    private static graphenePatch(
        cols: number,
        rows: number,
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const idx: number[][] = [];
        for (let j = 0; j < rows; j++) {
            const row: number[] = [];
            for (let i = 0; i < cols; i++) {
                row.push(heavy.length);
                heavy.push("C");
            }
            idx.push(row);
        }
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                if (i < cols - 1) {
                    bonds.push([idx[j][i], idx[j][i + 1], 4]);
                }
                if (j % 2 === 0 && j < rows - 1) {
                    bonds.push([idx[j][i], idx[j + 1][i], 1]);
                }
            }
        }
        return { heavy, bonds };
    }

    private static diamondBlock(
        nx: number,
        ny: number,
        nz: number,
    ): { heavy: string[]; bonds: CompactBond[] } {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const basis = [
            [0, 0, 0],
            [0, 0.5, 0.5],
            [0.5, 0, 0.5],
            [0.5, 0.5, 0],
            [0.25, 0.25, 0.25],
            [0.25, 0.75, 0.75],
            [0.75, 0.25, 0.75],
            [0.75, 0.75, 0.25],
        ];
        const positions: number[][] = [];
        for (let x = 0; x < nx; x++) {
            for (let y = 0; y < ny; y++) {
                for (let z = 0; z < nz; z++) {
                    for (const b of basis) {
                        positions.push([x + b[0], y + b[1], z + b[2]]);
                        heavy.push("C");
                    }
                }
            }
        }
        for (let i = 0; i < positions.length; i++) {
            let found = 0;
            const dists: Array<[number, number]> = [];
            for (let j = 0; j < positions.length; j++) {
                if (i === j) {
                    continue;
                }
                const dx = positions[i][0] - positions[j][0];
                const dy = positions[i][1] - positions[j][1];
                const dz = positions[i][2] - positions[j][2];
                dists.push([dx * dx + dy * dy + dz * dz, j]);
            }
            dists.sort((a, b) => a[0] - b[0]);
            for (const [d2, j] of dists) {
                if (d2 > 0.2 || found >= 4) {
                    break;
                }
                if (j > i) {
                    bonds.push([i, j, 1]);
                }
                found++;
            }
        }
        return { heavy, bonds };
    }

    private static exoticEntry(
        id: string,
        name: string,
        smiles: string,
        graph: { heavy: string[]; bonds: CompactBond[] },
        tags: string[],
    ): ICompactMoleculeSpec {
        const formula = MoleculeCatalog.formulaOf(graph.heavy, graph.bonds);
        return MoleculeCatalog.make(
            id,
            name,
            formula,
            smiles,
            "exotic",
            ["exotic", "carbon", ...tags],
            graph.heavy,
            graph.bonds,
        );
    }

    private static buildExotic(): ICompactMoleculeSpec[] {
        const graphene = MoleculeCatalog.graphenePatch(8, 8);
        const graphite = MoleculeCatalog.mergeParts(
            [
                MoleculeCatalog.graphenePatch(6, 6),
                MoleculeCatalog.graphenePatch(6, 6),
                MoleculeCatalog.graphenePatch(6, 6),
            ],
            [],
        );
        return [
            MoleculeCatalog.exoticEntry(
                "c60",
                "C60 Fullerene",
                "C60",
                MoleculeCatalog.fullereneCage(12),
                ["fullerene"],
            ),
            MoleculeCatalog.exoticEntry(
                "c70",
                "C70 Fullerene",
                "C70",
                MoleculeCatalog.fullereneCage(14),
                ["fullerene"],
            ),
            MoleculeCatalog.exoticEntry(
                "nanotube-armchair",
                "Nanotube (Armchair)",
                "CNT",
                MoleculeCatalog.nanotube(10, 12, 1),
                ["nanotube"],
            ),
            MoleculeCatalog.exoticEntry(
                "nanotube-zigzag",
                "Nanotube (Zigzag)",
                "CNT",
                MoleculeCatalog.nanotube(10, 12, 0),
                ["nanotube"],
            ),
            MoleculeCatalog.exoticEntry("graphene", "Graphene Sheet", "C", graphene, ["sheet"]),
            MoleculeCatalog.exoticEntry("graphite", "Graphite Stack", "C", graphite, ["sheet"]),
            MoleculeCatalog.exoticEntry(
                "diamond",
                "Diamond",
                "C",
                MoleculeCatalog.diamondBlock(2, 2, 2),
                ["crystal"],
            ),
            MoleculeCatalog.exoticEntry(
                "nanodiamond",
                "Nanodiamond",
                "C",
                MoleculeCatalog.diamondBlock(2, 2, 1),
                ["crystal"],
            ),
        ];
    }

    private static buildBiomolecules(): ICompactMoleculeSpec[] {
        const pool = [...MoleculeCatalog.buildNucleotides()];
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "dna-duplex"),
                "dna-duplex-bio",
                "DNA Double Helix",
                "biomolecules",
                ["biomolecule", "helix"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "rna-hairpin"),
                "rna-hairpin-bio",
                "RNA Hairpin",
                "biomolecules",
                ["biomolecule"],
            ),
        ];
        const hemeHeavy: string[] = [];
        const hemeBonds: CompactBond[] = [];
        for (let k = 0; k < 4; k++) {
            const base = hemeHeavy.length;
            hemeHeavy.push("N", "C", "C", "C", "C");
            hemeBonds.push(
                [base, base + 1, 1],
                [base + 1, base + 2, 1],
                [base + 2, base + 3, 2],
                [base + 3, base + 4, 1],
                [base + 4, base, 2],
            );
        }
        for (let k = 0; k < 4; k++) {
            const m = hemeHeavy.length;
            hemeHeavy.push("C");
            const aNext = 5 * ((k + 1) % 4) + 4;
            hemeBonds.push([5 * k + 1, m, 2], [m, aNext, 1]);
        }
        const feIdx = hemeHeavy.length;
        hemeHeavy.push("Fe");
        for (let k = 0; k < 4; k++) {
            hemeBonds.push([feIdx, 5 * k, 1]);
        }
        const addSub = (atom: number, atoms: string[], orders: number[]): void => {
            let prev = atom;
            for (let i = 0; i < atoms.length; i++) {
                const idx = hemeHeavy.length;
                hemeHeavy.push(atoms[i]);
                hemeBonds.push([prev, idx, orders[i]]);
                prev = idx;
            }
        };
        addSub(2, ["C"], [1]);
        addSub(7, ["C"], [1]);
        addSub(12, ["C"], [1]);
        addSub(17, ["C"], [1]);
        addSub(3, ["C", "C"], [1, 2]);
        addSub(13, ["C", "C"], [1, 2]);
        const addPropionate = (atom: number): void => {
            const c1 = hemeHeavy.length;
            hemeHeavy.push("C", "C", "C", "O", "O");
            hemeBonds.push(
                [atom, c1, 1],
                [c1, c1 + 1, 1],
                [c1 + 1, c1 + 2, 1],
                [c1 + 2, c1 + 3, 2],
                [c1 + 2, c1 + 4, 1],
            );
        };
        addPropionate(8);
        addPropionate(18);
        specs.push(
            MoleculeCatalog.make(
                "heme-b",
                "Heme B",
                "C34H32FeN4O4",
                "CC1=C(C2=CC3=NC(=CC4=C(C(=C(N4)C=C5C(=C(C(=N5)C=C1N2)C=C)C)C)CCC(=O)O)C(=C3CCC(=O)O)C)C=C",
                "biomolecules",
                ["biomolecule", "heme"],
                hemeHeavy,
                hemeBonds,
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "insulin",
                "Insulin",
                "SEQ:GIVEQCCTSICSLYQLENYCN+FVNQHLCGSHLVEALYLVCGERGFFYTPKT",
                "biomolecules",
                MoleculeCatalog.buildProtein(
                    ["GIVEQCCTSICSLYQLENYCN", "FVNQHLCGSHLVEALYLVCGERGFFYTPKT"],
                    [
                        [0, 5, 0, 10],
                        [0, 6, 1, 6],
                        [0, 19, 1, 18],
                    ],
                    [false, false],
                ),
                ["biomolecule", "hormone", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "insulin-neuro",
                "Insulin",
                "SEQ:GIVEQCCTSICSLYQLENYCN+FVNQHLCGSHLVEALYLVCGERGFFYTPKT",
                "neuro",
                MoleculeCatalog.buildProtein(
                    ["GIVEQCCTSICSLYQLENYCN", "FVNQHLCGSHLVEALYLVCGERGFFYTPKT"],
                    [
                        [0, 5, 0, 10],
                        [0, 6, 1, 6],
                        [0, 19, 1, 18],
                    ],
                    [false, false],
                ),
                ["neuro", "hormone", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "collagen-fragment",
                "Collagen Fragment",
                "SEQ:GJPGJPGJPGJPGJPGJPG",
                "biomolecules",
                MoleculeCatalog.buildProtein(["GJPGJPGJPGJPGJPGJPG"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "myoglobin-fragment",
                "Myoglobin Fragment",
                "SEQ:GLSDGEWQLVLNVWGKVEADIAGHG",
                "biomolecules",
                MoleculeCatalog.buildProtein(["GLSDGEWQLVLNVWGKVEADIAGHG"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "atp-synthase-fragment",
                "ATP Synthase Fragment",
                "SEQ:DIDTAAKFIGAGAATVGVAGS",
                "biomolecules",
                MoleculeCatalog.buildProtein(["DIDTAAKFIGAGAATVGVAGS"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "actin-fragment",
                "Actin Fragment",
                "SEQ:DDDIAALVVDNGSGMCK",
                "biomolecules",
                MoleculeCatalog.buildProtein(["DDDIAALVVDNGSGMCK"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "tubulin-fragment",
                "Tubulin Fragment",
                "SEQ:MREIVHIQAGQCGNQI",
                "biomolecules",
                MoleculeCatalog.buildProtein(["MREIVHIQAGQCGNQI"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        specs.push(
            MoleculeCatalog.proteinEntry(
                "antibody-fragment",
                "Antibody Fab Fragment",
                "SEQ:ARDYYGSSYWYFDV",
                "biomolecules",
                MoleculeCatalog.buildProtein(["ARDYYGSSYWYFDV"], [], [false]),
                ["biomolecule", "peptide"],
            ),
        );
        return specs;
    }

    private static buildNatural(): ICompactMoleculeSpec[] {
        const pool = [...MoleculeCatalog.buildAromatics(), ...MoleculeCatalog.buildLipids()];
        const specs: ICompactMoleculeSpec[] = [
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "indole"),
                "indole-natural",
                "Indole",
                "natural",
                ["natural", "aromatic"],
            ),
            MoleculeCatalog.cloneSpec(
                MoleculeCatalog.findSpec(pool, "capsaicin"),
                "capsaicin-natural",
                "Capsaicin",
                "natural",
                ["natural", "lipid"],
            ),
            MoleculeCatalog.make(
                "vanillin",
                "Vanillin",
                "C8H8O3",
                "COC1=C(O)C=CC(=C1)C=O",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "C", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [7, 8, 1],
                    [3, 9, 1],
                    [9, 10, 2],
                ],
            ),
            MoleculeCatalog.make(
                "limonene",
                "Limonene",
                "C10H16",
                "CC1=CCC(C(=C)C)CC1",
                "natural",
                ["natural", "ring"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 2],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 0, 1],
                    [3, 6, 1],
                    [0, 7, 1],
                    [7, 8, 2],
                    [7, 9, 1],
                ],
            ),
            MoleculeCatalog.make(
                "menthol",
                "Menthol",
                "C10H20O",
                "CC(C)C1CCC(C)CC1O",
                "natural",
                ["natural", "ring"],
                ["C", "C", "C", "C", "C", "C", "O", "C", "C", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 0, 1],
                    [0, 6, 1],
                    [2, 7, 1],
                    [4, 8, 1],
                    [8, 9, 1],
                    [8, 10, 1],
                ],
            ),
            MoleculeCatalog.make(
                "camphor",
                "Camphor",
                "C10H16O",
                "CC1(C)C2CCC1(C)C(=O)C2",
                "natural",
                ["natural", "ring"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "O"],
                [
                    [0, 2, 1],
                    [2, 3, 1],
                    [3, 1, 1],
                    [0, 4, 1],
                    [4, 5, 1],
                    [5, 1, 1],
                    [0, 6, 1],
                    [6, 1, 1],
                    [0, 7, 1],
                    [6, 8, 1],
                    [6, 9, 1],
                    [2, 10, 2],
                ],
            ),
            MoleculeCatalog.make(
                "cinnamaldehyde",
                "Cinnamaldehyde",
                "C9H8O",
                "O=CC=Cc1ccccc1",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "O"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [6, 7, 2, "E"],
                    [7, 8, 1],
                    [8, 9, 2],
                ],
            ),
            MoleculeCatalog.make(
                "eugenol",
                "Eugenol",
                "C10H12O2",
                "COC1=C(O)C=CC(=C1)CC=C",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "O", "O", "C", "C", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [7, 8, 1],
                    [5, 9, 1],
                    [9, 10, 1],
                    [10, 11, 2],
                ],
            ),
            MoleculeCatalog.make(
                "thymol",
                "Thymol",
                "C10H14O",
                "CC(C)C1=CC=C(C)C=C1O",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "O", "C", "C", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                    [4, 10, 1],
                ],
            ),
            MoleculeCatalog.make(
                "carvacrol",
                "Carvacrol",
                "C10H14O",
                "CC(C)C1=CC=C(C)C=C1O",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "O", "C", "C", "C", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [3, 6, 1],
                    [4, 7, 1],
                    [7, 8, 1],
                    [7, 9, 1],
                    [0, 10, 1],
                ],
            ),
            MoleculeCatalog.make(
                "geosmin",
                "Geosmin",
                "C12H22O",
                "CC1CCCC2(C)CCCC2C1O",
                "natural",
                ["natural", "ring"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "O"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 0, 1],
                    [2, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 1],
                    [9, 3, 1],
                    [0, 10, 1],
                    [6, 11, 1],
                    [3, 12, 1],
                ],
            ),
            MoleculeCatalog.make(
                "putrescine",
                "Putrescine",
                "C4H12N2",
                "NCCCCN",
                "natural",
                ["natural", "base"],
                ["N", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                ],
            ),
            MoleculeCatalog.make(
                "cadaverine",
                "Cadaverine",
                "C5H14N2",
                "NCCCCCN",
                "natural",
                ["natural", "base"],
                ["N", "C", "C", "C", "C", "C", "N"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 1],
                    [4, 5, 1],
                    [5, 6, 1],
                ],
            ),
            MoleculeCatalog.make(
                "skatole",
                "Skatole",
                "C9H9N",
                "CC1=CNC2=CC=CC=C12",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "C", "C", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [4, 6, 4],
                    [6, 7, 4],
                    [7, 8, 4],
                    [8, 5, 4],
                    [6, 9, 1],
                ],
                false,
                "",
                [],
                [[8, 1]],
            ),
            MoleculeCatalog.make(
                "piperine",
                "Piperine",
                "C17H19NO3",
                "O=C(N1CCCCC1)C=CC=Cc2ccc3c(c2)OCO3",
                "natural",
                ["natural", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "N",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [6, 8, 1],
                    [7, 8, 1],
                    [3, 9, 1],
                    [9, 10, 2],
                    [10, 11, 1],
                    [11, 12, 2],
                    [12, 13, 1],
                    [13, 14, 2],
                    [13, 15, 1],
                    [15, 16, 1],
                    [16, 17, 1],
                    [17, 18, 1],
                    [18, 19, 1],
                    [19, 20, 1],
                    [20, 15, 1],
                ],
            ),
            MoleculeCatalog.make(
                "curcumin",
                "Curcumin",
                "C21H20O6",
                "COC1=C(O)C=CC(=C1)C=CC(=O)CC(=O)C=Cc2ccc(O)c(OC)c2",
                "natural",
                ["natural", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [1, 7, 1],
                    [7, 8, 1],
                    [3, 9, 1],
                    [9, 10, 2],
                    [10, 11, 1],
                    [11, 12, 2],
                    [11, 13, 1],
                    [13, 14, 1],
                    [14, 15, 2],
                    [14, 16, 1],
                    [16, 17, 2],
                    [17, 18, 1],
                    [18, 19, 4],
                    [19, 20, 4],
                    [20, 21, 4],
                    [21, 22, 4],
                    [22, 23, 4],
                    [23, 18, 4],
                    [20, 24, 1],
                    [21, 25, 1],
                    [25, 26, 1],
                ],
            ),
            MoleculeCatalog.make(
                "quercetin",
                "Quercetin",
                "C15H10O7",
                "OC1=CC(O)=C2C(=C1)OC(=C(O)C2=O)C3=CC(O)=C(O)C=C3",
                "natural",
                ["natural", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "O",
                    "C",
                    "C",
                    "O",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [2, 7, 1],
                    [5, 9, 1],
                    [9, 8, 1],
                    [8, 10, 2],
                    [10, 11, 1],
                    [11, 4, 1],
                    [11, 12, 2],
                    [10, 13, 1],
                    [8, 14, 1],
                    [14, 15, 4],
                    [15, 16, 4],
                    [16, 17, 4],
                    [17, 18, 4],
                    [18, 19, 4],
                    [19, 14, 4],
                    [16, 20, 1],
                    [17, 21, 1],
                ],
            ),
            MoleculeCatalog.make(
                "resveratrol",
                "Resveratrol",
                "C14H12O3",
                "OC1=CC=C(C=C1)C=Cc2cc(O)cc(O)c2",
                "natural",
                ["natural", "aromatic"],
                [
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "C",
                    "O",
                    "O",
                ],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [0, 6, 1],
                    [2, 15, 1],
                    [4, 7, 1],
                    [7, 8, 2, "E"],
                    [8, 9, 1],
                    [9, 10, 4],
                    [10, 11, 4],
                    [11, 12, 4],
                    [12, 13, 4],
                    [13, 14, 4],
                    [14, 9, 4],
                    [11, 16, 1],
                ],
            ),
            MoleculeCatalog.make(
                "theobromine",
                "Theobromine",
                "C7H8N4O2",
                "CN1C=NC2=C1C(=O)N(C)C(=O)2",
                "natural",
                ["natural", "stimulant"],
                ["N", "C", "N", "C", "C", "C", "O", "O", "N", "C", "N", "C", "C"],
                [
                    [0, 1, 1],
                    [1, 2, 1],
                    [2, 3, 1],
                    [3, 4, 2],
                    [4, 5, 1],
                    [5, 0, 1],
                    [1, 6, 2],
                    [5, 7, 2],
                    [3, 8, 1],
                    [8, 9, 1],
                    [9, 10, 2],
                    [10, 4, 1],
                    [2, 11, 1],
                    [8, 12, 1],
                ],
                false,
                "",
                [],
                [[0, 1]],
            ),
            MoleculeCatalog.make(
                "nicotine",
                "Nicotine",
                "C10H14N2",
                "CN1CCCC1C2=CN=CC=C2",
                "natural",
                ["natural", "aromatic"],
                ["C", "C", "C", "C", "C", "N", "C", "C", "C", "C", "N", "C"],
                [
                    [0, 1, 4],
                    [1, 2, 4],
                    [2, 3, 4],
                    [3, 4, 4],
                    [4, 5, 4],
                    [5, 0, 4],
                    [2, 6, 1],
                    [6, 7, 1],
                    [7, 8, 1],
                    [8, 9, 1],
                    [9, 10, 1],
                    [10, 6, 1],
                    [10, 11, 1],
                ],
            ),
        ];
        return specs;
    }
}
