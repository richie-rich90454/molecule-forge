import type { MoleculeCategory } from "../chem/MoleculeRecord";

export interface IReactantMatcher {
    readonly category: MoleculeCategory | null;
    readonly tag: string | null;
    readonly moleculeId: string;
    readonly count: number;
}

export interface IProductSpec {
    readonly moleculeId: string;
    readonly count: number;
}

export interface IReactionConditions {
    readonly tempMin: number | null;
    readonly tempMax: number | null;
    readonly needsSpark: boolean;
    readonly needsCatalyst: boolean;
    readonly phMin: number | null;
    readonly phMax: number | null;
}

export interface IReactionVisual {
    readonly flash: string;
    readonly particles: string;
}

export interface IReactionRule {
    readonly id: string;
    readonly reactants: ReadonlyArray<IReactantMatcher>;
    readonly products: ReadonlyArray<IProductSpec>;
    readonly conditions: IReactionConditions;
    readonly activationEnergy: number;
    readonly deltaH: number;
    readonly visual: IReactionVisual;
    readonly rateLaw: string;
    readonly reference: string;
    readonly message: string;
}

export class ReactionCatalog {
    public static buildRules(): IReactionRule[] {
        const calm: IReactionConditions = {
            tempMin: null,
            tempMax: null,
            needsSpark: false,
            needsCatalyst: false,
            phMin: null,
            phMax: null,
        };
        const hot = (tempMin: number): IReactionConditions => ({
            tempMin,
            tempMax: null,
            needsSpark: false,
            needsCatalyst: false,
            phMin: null,
            phMax: null,
        });
        return [
            {
                id: "combustion-methane",
                reactants: [
                    { category: null, tag: null, moleculeId: "alkane-c1", count: 1 },
                    { category: null, tag: null, moleculeId: "oxygen", count: 2 },
                ],
                products: [
                    { moleculeId: "carbon-dioxide", count: 1 },
                    { moleculeId: "water", count: 2 },
                ],
                conditions: hot(700),
                activationEnergy: 45,
                deltaH: -890,
                visual: { flash: "#ff8040", particles: "spark" },
                rateLaw: "k * [fuel] * [O2]^2",
                reference: "NIST Kinetics Database",
                message: "Methane burns in oxygen: clean blue flame.",
            },
            {
                id: "combustion-ethene",
                reactants: [
                    { category: null, tag: null, moleculeId: "ethene", count: 1 },
                    { category: null, tag: null, moleculeId: "oxygen", count: 3 },
                ],
                products: [
                    { moleculeId: "carbon-dioxide", count: 2 },
                    { moleculeId: "water", count: 2 },
                ],
                conditions: hot(700),
                activationEnergy: 40,
                deltaH: -1411,
                visual: { flash: "#ff9040", particles: "spark" },
                rateLaw: "k * [fuel] * [O2]^3",
                reference: "NIST Kinetics Database",
                message: "Ethene combusts into carbon dioxide and water.",
            },
            {
                id: "combustion-benzene",
                reactants: [
                    { category: null, tag: null, moleculeId: "benzene", count: 2 },
                    { category: null, tag: null, moleculeId: "oxygen", count: 15 },
                ],
                products: [
                    { moleculeId: "carbon-dioxide", count: 12 },
                    { moleculeId: "water", count: 6 },
                ],
                conditions: hot(750),
                activationEnergy: 55,
                deltaH: -3268,
                visual: { flash: "#ffa040", particles: "smoke" },
                rateLaw: "k * [fuel]^2 * [O2]^15",
                reference: "NIST Kinetics Database",
                message: "Benzene burns with a smoky orange flame.",
            },
            {
                id: "combustion-generic",
                reactants: [
                    { category: "alkanes", tag: null, moleculeId: "", count: 1 },
                    { category: null, tag: null, moleculeId: "oxygen", count: 2 },
                ],
                products: [
                    { moleculeId: "carbon-dioxide", count: 2 },
                    { moleculeId: "water", count: 3 },
                ],
                conditions: hot(700),
                activationEnergy: 48,
                deltaH: -1200,
                visual: { flash: "#ff8040", particles: "spark" },
                rateLaw: "k * [fuel] * [O2]^2",
                reference: "NIST Kinetics Database",
                message: "A hydrocarbon burns in oxygen.",
            },
            {
                id: "polymerization-styrene",
                reactants: [{ category: null, tag: null, moleculeId: "styrene", count: 3 }],
                products: [{ moleculeId: "polystyrene", count: 1 }],
                conditions: {
                    tempMin: 320,
                    tempMax: null,
                    needsSpark: false,
                    needsCatalyst: true,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 25,
                deltaH: -70,
                visual: { flash: "#7ef2e0", particles: "link" },
                rateLaw: "k * [styrene]^3 * [catalyst]",
                reference: "Polymer Handbook",
                message: "Styrene links into a polystyrene chain.",
            },
            {
                id: "polymerization-ethene",
                reactants: [{ category: null, tag: null, moleculeId: "ethene", count: 4 }],
                products: [{ moleculeId: "polyethylene", count: 1 }],
                conditions: {
                    tempMin: 350,
                    tempMax: null,
                    needsSpark: false,
                    needsCatalyst: true,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 22,
                deltaH: -95,
                visual: { flash: "#7ef2e0", particles: "link" },
                rateLaw: "k * [ethene]^4 * [catalyst]",
                reference: "Polymer Handbook",
                message: "Ethene polymerizes into polyethylene.",
            },
            {
                id: "peptide-bond",
                reactants: [{ category: null, tag: null, moleculeId: "glycine", count: 2 }],
                products: [
                    { moleculeId: "diglycine", count: 1 },
                    { moleculeId: "water", count: 1 },
                ],
                conditions: {
                    tempMin: 300,
                    tempMax: null,
                    needsSpark: false,
                    needsCatalyst: true,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 30,
                deltaH: 15,
                visual: { flash: "#9adcff", particles: "link" },
                rateLaw: "k * [glycine]^2 * [catalyst]",
                reference: "Biochemistry textbook",
                message: "Two glycines join by a peptide bond, releasing water.",
            },
            {
                id: "neutralization",
                reactants: [
                    { category: null, tag: null, moleculeId: "acetic-acid", count: 1 },
                    { category: null, tag: null, moleculeId: "ammonia", count: 1 },
                ],
                products: [{ moleculeId: "ammonium-acetate", count: 1 }],
                conditions: calm,
                activationEnergy: 8,
                deltaH: -45,
                visual: { flash: "#bfe8ff", particles: "puff" },
                rateLaw: "k * [acid] * [base]",
                reference: "General chemistry",
                message: "Acetic acid and ammonia neutralize into a salt.",
            },
            {
                id: "nitration",
                reactants: [
                    { category: null, tag: null, moleculeId: "benzene", count: 1 },
                    { category: null, tag: null, moleculeId: "nitric-acid", count: 1 },
                ],
                products: [
                    { moleculeId: "nitrobenzene", count: 1 },
                    { moleculeId: "water", count: 1 },
                ],
                conditions: {
                    tempMin: 300,
                    tempMax: 340,
                    needsSpark: false,
                    needsCatalyst: true,
                    phMin: null,
                    phMax: 2,
                },
                activationEnergy: 35,
                deltaH: -65,
                visual: { flash: "#ffd479", particles: "puff" },
                rateLaw: "k * [benzene] * [HNO3] * [catalyst]",
                reference: "Organic synthesis",
                message: "Benzene nitrates into nitrobenzene.",
            },
            {
                id: "hydrogenation",
                reactants: [
                    { category: null, tag: null, moleculeId: "ethene", count: 1 },
                    { category: null, tag: null, moleculeId: "hydrogen", count: 1 },
                ],
                products: [{ moleculeId: "alkane-c2", count: 1 }],
                conditions: {
                    tempMin: null,
                    tempMax: null,
                    needsSpark: false,
                    needsCatalyst: true,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 20,
                deltaH: -136,
                visual: { flash: "#9adcff", particles: "puff" },
                rateLaw: "k * [ethene] * [H2] * [catalyst]",
                reference: "Catalysis textbook",
                message: "Ethene hydrogenates into ethane.",
            },
            {
                id: "detonation-tnt",
                reactants: [{ category: null, tag: null, moleculeId: "tnt", count: 2 }],
                products: [
                    { moleculeId: "nitrogen", count: 3 },
                    { moleculeId: "carbon-dioxide", count: 6 },
                    { moleculeId: "water", count: 4 },
                ],
                conditions: {
                    tempMin: 500,
                    tempMax: null,
                    needsSpark: true,
                    needsCatalyst: false,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 5,
                deltaH: -4200,
                visual: { flash: "#ff5030", particles: "boom" },
                rateLaw: "detonation front",
                reference: "Energetics handbook",
                message: "TNT detonates: shockwave and fireball.",
            },
            {
                id: "detonation-nitroglycerin",
                reactants: [{ category: null, tag: null, moleculeId: "nitroglycerin", count: 2 }],
                products: [
                    { moleculeId: "nitrogen", count: 3 },
                    { moleculeId: "carbon-dioxide", count: 6 },
                    { moleculeId: "water", count: 5 },
                    { moleculeId: "oxygen", count: 1 },
                ],
                conditions: {
                    tempMin: 450,
                    tempMax: null,
                    needsSpark: true,
                    needsCatalyst: false,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 4,
                deltaH: -3800,
                visual: { flash: "#ff5030", particles: "boom" },
                rateLaw: "detonation front",
                reference: "Energetics handbook",
                message: "Nitroglycerin detonates violently.",
            },
            {
                id: "crystallization",
                reactants: [
                    { category: null, tag: null, moleculeId: "sodium-chloride", count: 2 },
                    { category: null, tag: null, moleculeId: "water", count: 2 },
                ],
                products: [],
                conditions: {
                    tempMin: null,
                    tempMax: 280,
                    needsSpark: false,
                    needsCatalyst: false,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 10,
                deltaH: -5,
                visual: { flash: "#bfe8ff", particles: "crystal" },
                rateLaw: "nucleation limited",
                reference: "Crystallization textbook",
                message: "Salt crystallizes out of the cold solution.",
            },
            {
                id: "protein-folding",
                reactants: [{ category: null, tag: null, moleculeId: "insulin", count: 1 }],
                products: [],
                conditions: {
                    tempMin: null,
                    tempMax: 310,
                    needsSpark: false,
                    needsCatalyst: false,
                    phMin: null,
                    phMax: null,
                },
                activationEnergy: 12,
                deltaH: -120,
                visual: { flash: "#9adcff", particles: "fold" },
                rateLaw: "two-state folding",
                reference: "Biophysics textbook",
                message: "Insulin collapses into its folded shape.",
            },
            {
                id: "atp-hydrolysis",
                reactants: [{ category: null, tag: null, moleculeId: "atp", count: 1 }],
                products: [
                    { moleculeId: "adp", count: 1 },
                    { moleculeId: "phosphoric-acid", count: 1 },
                ],
                conditions: calm,
                activationEnergy: 18,
                deltaH: -30,
                visual: { flash: "#ffd479", particles: "spark" },
                rateLaw: "k * [ATP]",
                reference: "Biochemistry textbook",
                message: "ATP hydrolyzes into ADP plus phosphate, releasing energy.",
            },
        ];
    }
}
