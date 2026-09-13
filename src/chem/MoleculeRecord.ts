export type MoleculeCategory =
    | "alkanes"
    | "alkenes"
    | "aromatics"
    | "functional"
    | "amino"
    | "sugars"
    | "nucleotides"
    | "lipids"
    | "pharma"
    | "neuro"
    | "polymers"
    | "explosives"
    | "toxins"
    | "exotic"
    | "biomolecules"
    | "natural"
    | "elemental";

export type BondOrder = 1 | 2 | 3 | 4;

export interface IAtomSpec {
    readonly el: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly charge: number;
    readonly stereo: string | null;
    readonly aromatic: boolean;
}

export interface IBondSpec {
    readonly a: number;
    readonly b: number;
    readonly order: BondOrder;
    readonly aromatic: boolean;
    readonly stereo: string | null;
    readonly ionic?: boolean;
}

export interface IMoleculeProperties {
    readonly logP: number;
    readonly hBondDonors: number;
    readonly hBondAcceptors: number;
    readonly rotatable: number;
    readonly tpsa: number;
}

export interface IMoleculeProvenance {
    readonly source: string;
    readonly generatorVersion: string;
    readonly smilesCanonical: string;
}

export interface IMoleculeRecord {
    readonly id: string;
    readonly name: string;
    readonly formula: string;
    readonly smiles: string;
    readonly inchi: string;
    readonly category: MoleculeCategory;
    readonly tags: ReadonlyArray<string>;
    readonly warn: boolean;
    readonly mass: number;
    readonly atoms: ReadonlyArray<IAtomSpec>;
    readonly bonds: ReadonlyArray<IBondSpec>;
    readonly properties: IMoleculeProperties;
    readonly provenance: IMoleculeProvenance;
}

export type CompactBond = readonly [number, number, number, string?];

export interface ICompactMoleculeSpec {
    readonly id: string;
    readonly name: string;
    readonly formula: string;
    readonly smiles: string;
    readonly category: MoleculeCategory;
    readonly tags: ReadonlyArray<string>;
    readonly warn: boolean;
    readonly inchi: string;
    readonly heavy: ReadonlyArray<string>;
    readonly bonds: ReadonlyArray<CompactBond>;
    readonly charges: ReadonlyArray<readonly [number, number]>;
    readonly explicitH: ReadonlyArray<readonly [number, number]>;
    readonly ionicBonds?: ReadonlyArray<readonly [number, number]>;
}

export interface IMoleculeRegistry {
    getCategories(): ReadonlyArray<MoleculeCategory>;
    getRecords(category: MoleculeCategory): ReadonlyArray<IMoleculeRecord>;
    getAllRecords(): ReadonlyArray<IMoleculeRecord>;
    findById(id: string): IMoleculeRecord | undefined;
    getCount(): number;
}

export interface IMoleculeDataSource {
    loadAll(): Promise<ReadonlyArray<IMoleculeRecord>>;
    loadByCategory(category: MoleculeCategory): Promise<ReadonlyArray<IMoleculeRecord>>;
}
