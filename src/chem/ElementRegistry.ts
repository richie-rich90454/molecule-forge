export interface IElementInfo {
    readonly number: number;
    readonly symbol: string;
    readonly mass: number;
    readonly covalentRadius: number;
    readonly vdwRadius: number;
    readonly color: string;
    readonly maxValence: number;
}

export class ElementRegistry {
    private static readonly ELEMENTS: ReadonlyMap<string, IElementInfo> = new Map([
        [
            "H",
            {
                number: 1,
                symbol: "H",
                mass: 1.008,
                covalentRadius: 0.31,
                vdwRadius: 1.2,
                color: "#e8ecf4",
                maxValence: 1,
            },
        ],
        [
            "B",
            {
                number: 5,
                symbol: "B",
                mass: 10.81,
                covalentRadius: 0.84,
                vdwRadius: 1.92,
                color: "#ffb3b3",
                maxValence: 4,
            },
        ],
        [
            "C",
            {
                number: 6,
                symbol: "C",
                mass: 12.011,
                covalentRadius: 0.76,
                vdwRadius: 1.7,
                color: "#8f9bb3",
                maxValence: 4,
            },
        ],
        [
            "N",
            {
                number: 7,
                symbol: "N",
                mass: 14.007,
                covalentRadius: 0.71,
                vdwRadius: 1.55,
                color: "#5c8dff",
                maxValence: 4,
            },
        ],
        [
            "O",
            {
                number: 8,
                symbol: "O",
                mass: 15.999,
                covalentRadius: 0.66,
                vdwRadius: 1.52,
                color: "#ff5c5c",
                maxValence: 2,
            },
        ],
        [
            "F",
            {
                number: 9,
                symbol: "F",
                mass: 18.998,
                covalentRadius: 0.57,
                vdwRadius: 1.47,
                color: "#7dff9a",
                maxValence: 1,
            },
        ],
        [
            "Na",
            {
                number: 11,
                symbol: "Na",
                mass: 22.99,
                covalentRadius: 1.66,
                vdwRadius: 2.27,
                color: "#b45cff",
                maxValence: 1,
            },
        ],
        [
            "Mg",
            {
                number: 12,
                symbol: "Mg",
                mass: 24.305,
                covalentRadius: 1.41,
                vdwRadius: 1.73,
                color: "#3ddc84",
                maxValence: 2,
            },
        ],
        [
            "Si",
            {
                number: 14,
                symbol: "Si",
                mass: 28.085,
                covalentRadius: 1.11,
                vdwRadius: 2.1,
                color: "#e0b46a",
                maxValence: 4,
            },
        ],
        [
            "P",
            {
                number: 15,
                symbol: "P",
                mass: 30.974,
                covalentRadius: 1.07,
                vdwRadius: 1.8,
                color: "#ff9a3c",
                maxValence: 5,
            },
        ],
        [
            "S",
            {
                number: 16,
                symbol: "S",
                mass: 32.06,
                covalentRadius: 1.05,
                vdwRadius: 1.8,
                color: "#ffd23c",
                maxValence: 6,
            },
        ],
        [
            "Cl",
            {
                number: 17,
                symbol: "Cl",
                mass: 35.45,
                covalentRadius: 1.02,
                vdwRadius: 1.75,
                color: "#4ce06a",
                maxValence: 1,
            },
        ],
        [
            "K",
            {
                number: 19,
                symbol: "K",
                mass: 39.098,
                covalentRadius: 2.03,
                vdwRadius: 2.75,
                color: "#9a6bff",
                maxValence: 1,
            },
        ],
        [
            "Ca",
            {
                number: 20,
                symbol: "Ca",
                mass: 40.078,
                covalentRadius: 1.76,
                vdwRadius: 2.31,
                color: "#7de08a",
                maxValence: 2,
            },
        ],
        [
            "Fe",
            {
                number: 26,
                symbol: "Fe",
                mass: 55.845,
                covalentRadius: 1.32,
                vdwRadius: 2.04,
                color: "#e08a3c",
                maxValence: 6,
            },
        ],
        [
            "Cu",
            {
                number: 29,
                symbol: "Cu",
                mass: 63.546,
                covalentRadius: 1.32,
                vdwRadius: 1.96,
                color: "#e08a5c",
                maxValence: 4,
            },
        ],
        [
            "Zn",
            {
                number: 30,
                symbol: "Zn",
                mass: 65.38,
                covalentRadius: 1.22,
                vdwRadius: 2.01,
                color: "#8ad0e0",
                maxValence: 4,
            },
        ],
        [
            "Se",
            {
                number: 34,
                symbol: "Se",
                mass: 78.971,
                covalentRadius: 1.2,
                vdwRadius: 1.9,
                color: "#e0a53c",
                maxValence: 6,
            },
        ],
        [
            "As",
            {
                number: 33,
                symbol: "As",
                mass: 74.922,
                covalentRadius: 1.19,
                vdwRadius: 1.85,
                color: "#a07de0",
                maxValence: 5,
            },
        ],
        [
            "Br",
            {
                number: 35,
                symbol: "Br",
                mass: 79.904,
                covalentRadius: 1.2,
                vdwRadius: 1.85,
                color: "#a04c2c",
                maxValence: 1,
            },
        ],
        [
            "I",
            {
                number: 53,
                symbol: "I",
                mass: 126.904,
                covalentRadius: 1.39,
                vdwRadius: 1.98,
                color: "#940094",
                maxValence: 1,
            },
        ],
        [
            "Pt",
            {
                number: 78,
                symbol: "Pt",
                mass: 195.084,
                covalentRadius: 1.36,
                vdwRadius: 2.05,
                color: "#d0d8e8",
                maxValence: 6,
            },
        ],
    ]);

    private static readonly BOND_LENGTHS: ReadonlyMap<string, number> = new Map([
        ["C-C", 1.54],
        ["C=C", 1.34],
        ["C#C", 1.2],
        ["C-H", 1.09],
        ["C-N", 1.47],
        ["C-O", 1.43],
        ["C=O", 1.21],
        ["C-F", 1.35],
        ["C-Cl", 1.77],
        ["C-Br", 1.94],
        ["C-I", 2.14],
        ["C-S", 1.82],
        ["C-P", 1.85],
        ["C-Si", 1.87],
        ["N-H", 1.01],
        ["N-N", 1.45],
        ["N-O", 1.4],
        ["O-H", 0.96],
        ["O-O", 1.48],
        ["O-P", 1.6],
        ["P=O", 1.48],
        ["S-H", 1.34],
        ["S=O", 1.43],
        ["H-H", 0.74],
        ["C-Se", 1.95],
        ["Fe-N", 2.0],
    ]);

    public static get(symbol: string): IElementInfo {
        const info = ElementRegistry.ELEMENTS.get(symbol);
        if (info === undefined) {
            throw new Error("Unknown element: " + symbol);
        }
        return info;
    }

    public static has(symbol: string): boolean {
        return ElementRegistry.ELEMENTS.has(symbol);
    }

    public static getSymbols(): ReadonlyArray<string> {
        return Array.from(ElementRegistry.ELEMENTS.keys());
    }

    public static bondLength(a: string, b: string, order: number): number {
        const key = a + "-" + b;
        const alt = b + "-" + a;
        const table = ElementRegistry.BOND_LENGTHS;
        if (order === 2) {
            const dbl = table.get(a + "=" + b) ?? table.get(b + "=" + a);
            if (dbl !== undefined) {
                return dbl;
            }
        }
        if (order === 3) {
            const tpl = table.get(a + "#" + b) ?? table.get(b + "#" + a);
            if (tpl !== undefined) {
                return tpl;
            }
        }
        const single = table.get(key) ?? table.get(alt);
        if (single !== undefined) {
            return order === 4 ? single - 0.12 : single;
        }
        const ra = ElementRegistry.get(a).covalentRadius;
        const rb = ElementRegistry.get(b).covalentRadius;
        const correction = order === 2 ? -0.2 : order === 3 ? -0.34 : order === 4 ? -0.12 : 0;
        return ra + rb + correction;
    }

    public static implicitHydrogens(symbol: string, bondOrderSum: number, charge: number): number {
        if (symbol === "H") {
            return 0;
        }
        if (symbol === "C") {
            return Math.max(0, 4 - bondOrderSum);
        }
        if (symbol === "N") {
            if (charge > 0) {
                return Math.max(0, 4 - bondOrderSum);
            }
            return Math.max(0, 3 - bondOrderSum);
        }
        if (symbol === "O") {
            if (charge < 0) {
                return 0;
            }
            return Math.max(0, 2 - bondOrderSum);
        }
        if (symbol === "S" || symbol === "Se") {
            if (bondOrderSum > 2) {
                return 0;
            }
            return Math.max(0, 2 - bondOrderSum);
        }
        if (symbol === "P") {
            if (bondOrderSum >= 5) {
                return 0;
            }
            return Math.max(0, 3 - bondOrderSum);
        }
        if (symbol === "F" || symbol === "Cl" || symbol === "Br" || symbol === "I") {
            return 0;
        }
        return 0;
    }
}
