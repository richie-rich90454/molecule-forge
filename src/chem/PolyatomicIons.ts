export interface IIonSpec {
    readonly id: string;
    readonly label: string;
    readonly formula: string;
    readonly charge: number;
    readonly composition: ReadonlyMap<string, number>;
    readonly heavy: ReadonlyArray<string>;
    readonly bonds: ReadonlyArray<readonly [number, number, number]>;
    readonly charges: ReadonlyArray<readonly [number, number]>;
    readonly explicitH: ReadonlyArray<readonly [number, number]>;
    readonly bindingAtom: number;
    readonly rank: number;
}

type IonRow = readonly [
    string, // id
    string, // label
    string, // formula
    number, // charge
    string, // composition "O:1,H:1"
    string, // heavy "O"
    ReadonlyArray<readonly [number, number, number]>, // internal bonds
    ReadonlyArray<readonly [number, number]>, // formal charges
    ReadonlyArray<readonly [number, number]>, // explicit hydrogens
    number, // binding atom
    number, // rank
];

const ANION_ROWS: ReadonlyArray<IonRow> = [
    ["hydroxide", "hydroxide", "OH", -1, "O:1,H:1", "O", [], [[0, -1]], [[0, 1]], 0, 1],
    ["cyanide", "cyanide", "CN", -1, "C:1,N:1", "C,N", [[0, 1, 3]], [[0, -1]], [], 0, 0],
    [
        "peroxide",
        "peroxide",
        "O2",
        -2,
        "O:2",
        "O,O",
        [[0, 1, 1]],
        [
            [0, -1],
            [1, -1],
        ],
        [],
        0,
        4,
    ],
    [
        "nitrate",
        "nitrate",
        "NO3",
        -1,
        "N:1,O:3",
        "N,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
        ],
        [
            [0, 1],
            [2, -1],
            [3, -1],
        ],
        [],
        1,
        0,
    ],
    [
        "nitrite",
        "nitrite",
        "NO2",
        -1,
        "N:1,O:2",
        "N,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
        ],
        [[2, -1]],
        [],
        1,
        1,
    ],
    [
        "carbonate",
        "carbonate",
        "CO3",
        -2,
        "C:1,O:3",
        "C,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
        ],
        [
            [2, -1],
            [3, -1],
        ],
        [],
        1,
        0,
    ],
    [
        "bicarbonate",
        "bicarbonate",
        "HCO3",
        -1,
        "C:1,H:1,O:3",
        "C,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
        ],
        [[2, -1]],
        [[3, 1]],
        1,
        1,
    ],
    [
        "sulfate",
        "sulfate",
        "SO4",
        -2,
        "S:1,O:4",
        "S,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 2],
            [0, 3, 1],
            [0, 4, 1],
        ],
        [
            [3, -1],
            [4, -1],
        ],
        [],
        3,
        0,
    ],
    [
        "sulfite",
        "sulfite",
        "SO3",
        -2,
        "S:1,O:3",
        "S,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
        ],
        [
            [2, -1],
            [3, -1],
        ],
        [],
        1,
        1,
    ],
    [
        "phosphate",
        "phosphate",
        "PO4",
        -3,
        "P:1,O:4",
        "P,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1],
        ],
        [
            [2, -1],
            [3, -1],
            [4, -1],
        ],
        [],
        1,
        0,
    ],
    [
        "hydrogen-phosphate",
        "hydrogen phosphate",
        "HPO4",
        -2,
        "H:1,P:1,O:4",
        "P,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1],
        ],
        [
            [2, -1],
            [3, -1],
        ],
        [[4, 1]],
        1,
        1,
    ],
    [
        "permanganate",
        "permanganate",
        "MnO4",
        -1,
        "Mn:1,O:4",
        "Mn,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1],
        ],
        [
            [0, 2],
            [2, -1],
            [3, -1],
            [4, -1],
        ],
        [],
        1,
        1,
    ],
    [
        "chromate",
        "chromate",
        "CrO4",
        -2,
        "Cr:1,O:4",
        "Cr,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 1],
            [0, 3, 1],
            [0, 4, 1],
        ],
        [
            [0, 1],
            [1, -1],
            [2, -1],
            [3, -1],
        ],
        [],
        2,
        1,
    ],
    [
        "hypochlorite",
        "hypochlorite",
        "ClO",
        -1,
        "Cl:1,O:1",
        "Cl,O",
        [[0, 1, 1]],
        [[1, -1]],
        [],
        1,
        1,
    ],
    [
        "chlorate",
        "chlorate",
        "ClO3",
        -1,
        "Cl:1,O:3",
        "Cl,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 2],
            [0, 3, 1],
        ],
        [[3, -1]],
        [],
        3,
        1,
    ],
    [
        "perchlorate",
        "perchlorate",
        "ClO4",
        -1,
        "Cl:1,O:4",
        "Cl,O,O,O,O",
        [
            [0, 1, 2],
            [0, 2, 2],
            [0, 3, 2],
            [0, 4, 1],
        ],
        [[4, -1]],
        [],
        4,
        1,
    ],
    [
        "acetate",
        "acetate",
        "C2H3O2",
        -1,
        "C:2,H:3,O:2",
        "C,C,O,O",
        [
            [0, 1, 1],
            [1, 2, 2],
            [1, 3, 1],
        ],
        [[3, -1]],
        [[0, 3]],
        3,
        0,
    ],
    [
        "oxalate",
        "oxalate",
        "C2O4",
        -2,
        "C:2,O:4",
        "C,C,O,O,O,O",
        [
            [0, 1, 1],
            [0, 2, 2],
            [0, 3, 1],
            [1, 4, 2],
            [1, 5, 1],
        ],
        [
            [3, -1],
            [5, -1],
        ],
        [],
        3,
        1,
    ],
];

const CATION_ROWS: ReadonlyArray<IonRow> = [
    ["ammonium", "ammonium", "NH4", 1, "N:1,H:4", "N", [], [[0, 1]], [[0, 4]], 0, 0],
];

function parseComposition(text: string): ReadonlyMap<string, number> {
    const map = new Map<string, number>();
    for (const part of text.split(",")) {
        const [symbol, count] = part.split(":");
        map.set(symbol, parseInt(count, 10));
    }
    return map;
}

function build(rows: ReadonlyArray<IonRow>): ReadonlyArray<IIonSpec> {
    return rows.map((row) => ({
        id: row[0],
        label: row[1],
        formula: row[2],
        charge: row[3],
        composition: parseComposition(row[4]),
        heavy: row[5].split(","),
        bonds: row[6],
        charges: row[7],
        explicitH: row[8],
        bindingAtom: row[9],
        rank: row[10],
    }));
}

export class PolyatomicIons {
    private static readonly ANIONS: ReadonlyArray<IIonSpec> = build(ANION_ROWS);
    private static readonly CATIONS: ReadonlyArray<IIonSpec> = build(CATION_ROWS);

    public static anions(): ReadonlyArray<IIonSpec> {
        return PolyatomicIons.ANIONS;
    }

    public static cations(): ReadonlyArray<IIonSpec> {
        return PolyatomicIons.CATIONS;
    }

    public static netCharge(ion: IIonSpec): number {
        let total = 0;
        for (const entry of ion.charges) {
            total += entry[1];
        }
        return total;
    }

    public static atomCount(ion: IIonSpec): number {
        let total = 0;
        for (const count of ion.composition.values()) {
            total += count;
        }
        return total;
    }

    public static containsOxygen(ion: IIonSpec): boolean {
        return ion.composition.has("O");
    }
}
