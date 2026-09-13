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
        [
            "He",
            {
                number: 2,
                symbol: "He",
                mass: 4.003,
                covalentRadius: 0.28,
                vdwRadius: 1.4,
                color: "#d9ffff",
                maxValence: 0,
            },
        ],
        [
            "Li",
            {
                number: 3,
                symbol: "Li",
                mass: 6.94,
                covalentRadius: 1.28,
                vdwRadius: 1.82,
                color: "#cc80ff",
                maxValence: 1,
            },
        ],
        [
            "Be",
            {
                number: 4,
                symbol: "Be",
                mass: 9.012,
                covalentRadius: 0.96,
                vdwRadius: 1.53,
                color: "#c2ff00",
                maxValence: 2,
            },
        ],
        [
            "Ne",
            {
                number: 10,
                symbol: "Ne",
                mass: 20.18,
                covalentRadius: 0.58,
                vdwRadius: 1.54,
                color: "#b3e3f5",
                maxValence: 0,
            },
        ],
        [
            "Al",
            {
                number: 13,
                symbol: "Al",
                mass: 26.982,
                covalentRadius: 1.21,
                vdwRadius: 1.84,
                color: "#bfa6a6",
                maxValence: 4,
            },
        ],
        [
            "Ar",
            {
                number: 18,
                symbol: "Ar",
                mass: 39.948,
                covalentRadius: 1.06,
                vdwRadius: 1.88,
                color: "#80d1e3",
                maxValence: 0,
            },
        ],
        [
            "Sc",
            {
                number: 21,
                symbol: "Sc",
                mass: 44.956,
                covalentRadius: 1.7,
                vdwRadius: 2.3,
                color: "#e6e6e6",
                maxValence: 6,
            },
        ],
        [
            "Ti",
            {
                number: 22,
                symbol: "Ti",
                mass: 47.867,
                covalentRadius: 1.6,
                vdwRadius: 2.15,
                color: "#bfc2c7",
                maxValence: 6,
            },
        ],
        [
            "V",
            {
                number: 23,
                symbol: "V",
                mass: 50.942,
                covalentRadius: 1.53,
                vdwRadius: 2.05,
                color: "#a6a6ab",
                maxValence: 6,
            },
        ],
        [
            "Cr",
            {
                number: 24,
                symbol: "Cr",
                mass: 51.996,
                covalentRadius: 1.39,
                vdwRadius: 2.0,
                color: "#8a99c7",
                maxValence: 6,
            },
        ],
        [
            "Mn",
            {
                number: 25,
                symbol: "Mn",
                mass: 54.938,
                covalentRadius: 1.5,
                vdwRadius: 2.05,
                color: "#9c7ac7",
                maxValence: 6,
            },
        ],
        [
            "Co",
            {
                number: 27,
                symbol: "Co",
                mass: 58.933,
                covalentRadius: 1.26,
                vdwRadius: 2.0,
                color: "#f090a0",
                maxValence: 6,
            },
        ],
        [
            "Ni",
            {
                number: 28,
                symbol: "Ni",
                mass: 58.693,
                covalentRadius: 1.24,
                vdwRadius: 1.97,
                color: "#50d050",
                maxValence: 6,
            },
        ],
        [
            "Ga",
            {
                number: 31,
                symbol: "Ga",
                mass: 69.723,
                covalentRadius: 1.22,
                vdwRadius: 1.87,
                color: "#c28f8f",
                maxValence: 3,
            },
        ],
        [
            "Ge",
            {
                number: 32,
                symbol: "Ge",
                mass: 72.63,
                covalentRadius: 1.2,
                vdwRadius: 2.11,
                color: "#668f8f",
                maxValence: 4,
            },
        ],
        [
            "Kr",
            {
                number: 36,
                symbol: "Kr",
                mass: 83.798,
                covalentRadius: 1.16,
                vdwRadius: 2.02,
                color: "#5cb8d1",
                maxValence: 0,
            },
        ],
        [
            "Rb",
            {
                number: 37,
                symbol: "Rb",
                mass: 85.468,
                covalentRadius: 2.2,
                vdwRadius: 2.9,
                color: "#702eb0",
                maxValence: 1,
            },
        ],
        [
            "Sr",
            {
                number: 38,
                symbol: "Sr",
                mass: 87.62,
                covalentRadius: 1.95,
                vdwRadius: 2.49,
                color: "#00ff00",
                maxValence: 2,
            },
        ],
        [
            "Y",
            {
                number: 39,
                symbol: "Y",
                mass: 88.906,
                covalentRadius: 1.9,
                vdwRadius: 2.32,
                color: "#94ffff",
                maxValence: 6,
            },
        ],
        [
            "Zr",
            {
                number: 40,
                symbol: "Zr",
                mass: 91.224,
                covalentRadius: 1.75,
                vdwRadius: 2.23,
                color: "#94e0e0",
                maxValence: 6,
            },
        ],
        [
            "Nb",
            {
                number: 41,
                symbol: "Nb",
                mass: 92.906,
                covalentRadius: 1.64,
                vdwRadius: 2.18,
                color: "#73c2c9",
                maxValence: 6,
            },
        ],
        [
            "Mo",
            {
                number: 42,
                symbol: "Mo",
                mass: 95.95,
                covalentRadius: 1.54,
                vdwRadius: 2.17,
                color: "#54b5b5",
                maxValence: 6,
            },
        ],
        [
            "Tc",
            {
                number: 43,
                symbol: "Tc",
                mass: 98.0,
                covalentRadius: 1.47,
                vdwRadius: 2.16,
                color: "#3b9e9e",
                maxValence: 6,
            },
        ],
        [
            "Ru",
            {
                number: 44,
                symbol: "Ru",
                mass: 101.07,
                covalentRadius: 1.46,
                vdwRadius: 2.13,
                color: "#248f8f",
                maxValence: 6,
            },
        ],
        [
            "Rh",
            {
                number: 45,
                symbol: "Rh",
                mass: 102.906,
                covalentRadius: 1.42,
                vdwRadius: 2.1,
                color: "#0a7d8c",
                maxValence: 6,
            },
        ],
        [
            "Pd",
            {
                number: 46,
                symbol: "Pd",
                mass: 106.42,
                covalentRadius: 1.39,
                vdwRadius: 2.1,
                color: "#006985",
                maxValence: 6,
            },
        ],
        [
            "Ag",
            {
                number: 47,
                symbol: "Ag",
                mass: 107.868,
                covalentRadius: 1.45,
                vdwRadius: 2.11,
                color: "#c0c0c0",
                maxValence: 4,
            },
        ],
        [
            "Cd",
            {
                number: 48,
                symbol: "Cd",
                mass: 112.414,
                covalentRadius: 1.44,
                vdwRadius: 2.18,
                color: "#ffd98f",
                maxValence: 2,
            },
        ],
        [
            "In",
            {
                number: 49,
                symbol: "In",
                mass: 114.818,
                covalentRadius: 1.42,
                vdwRadius: 2.36,
                color: "#a67573",
                maxValence: 3,
            },
        ],
        [
            "Sn",
            {
                number: 50,
                symbol: "Sn",
                mass: 118.71,
                covalentRadius: 1.39,
                vdwRadius: 2.17,
                color: "#668080",
                maxValence: 4,
            },
        ],
        [
            "Sb",
            {
                number: 51,
                symbol: "Sb",
                mass: 121.76,
                covalentRadius: 1.39,
                vdwRadius: 2.06,
                color: "#9e63b5",
                maxValence: 5,
            },
        ],
        [
            "Te",
            {
                number: 52,
                symbol: "Te",
                mass: 127.6,
                covalentRadius: 1.38,
                vdwRadius: 2.06,
                color: "#d47a00",
                maxValence: 6,
            },
        ],
        [
            "Xe",
            {
                number: 54,
                symbol: "Xe",
                mass: 131.293,
                covalentRadius: 1.4,
                vdwRadius: 2.16,
                color: "#429eb0",
                maxValence: 0,
            },
        ],
        [
            "Cs",
            {
                number: 55,
                symbol: "Cs",
                mass: 132.905,
                covalentRadius: 2.44,
                vdwRadius: 3.43,
                color: "#57178f",
                maxValence: 1,
            },
        ],
        [
            "Ba",
            {
                number: 56,
                symbol: "Ba",
                mass: 137.327,
                covalentRadius: 2.15,
                vdwRadius: 2.68,
                color: "#00c900",
                maxValence: 2,
            },
        ],
        [
            "La",
            {
                number: 57,
                symbol: "La",
                mass: 138.905,
                covalentRadius: 2.07,
                vdwRadius: 2.43,
                color: "#70d4ff",
                maxValence: 6,
            },
        ],
        [
            "Ce",
            {
                number: 58,
                symbol: "Ce",
                mass: 140.116,
                covalentRadius: 2.04,
                vdwRadius: 2.42,
                color: "#ffffc7",
                maxValence: 6,
            },
        ],
        [
            "Pr",
            {
                number: 59,
                symbol: "Pr",
                mass: 140.908,
                covalentRadius: 2.03,
                vdwRadius: 2.4,
                color: "#d9ffc7",
                maxValence: 6,
            },
        ],
        [
            "Nd",
            {
                number: 60,
                symbol: "Nd",
                mass: 144.242,
                covalentRadius: 2.01,
                vdwRadius: 2.39,
                color: "#c7ffc7",
                maxValence: 6,
            },
        ],
        [
            "Pm",
            {
                number: 61,
                symbol: "Pm",
                mass: 145.0,
                covalentRadius: 1.99,
                vdwRadius: 2.38,
                color: "#a3ffc7",
                maxValence: 6,
            },
        ],
        [
            "Sm",
            {
                number: 62,
                symbol: "Sm",
                mass: 150.36,
                covalentRadius: 1.98,
                vdwRadius: 2.36,
                color: "#8fffc7",
                maxValence: 6,
            },
        ],
        [
            "Eu",
            {
                number: 63,
                symbol: "Eu",
                mass: 151.964,
                covalentRadius: 1.98,
                vdwRadius: 2.35,
                color: "#61ffc7",
                maxValence: 6,
            },
        ],
        [
            "Gd",
            {
                number: 64,
                symbol: "Gd",
                mass: 157.25,
                covalentRadius: 1.96,
                vdwRadius: 2.34,
                color: "#45ffc7",
                maxValence: 6,
            },
        ],
        [
            "Tb",
            {
                number: 65,
                symbol: "Tb",
                mass: 158.925,
                covalentRadius: 1.94,
                vdwRadius: 2.33,
                color: "#30ffc7",
                maxValence: 6,
            },
        ],
        [
            "Dy",
            {
                number: 66,
                symbol: "Dy",
                mass: 162.5,
                covalentRadius: 1.92,
                vdwRadius: 2.31,
                color: "#1fffc7",
                maxValence: 6,
            },
        ],
        [
            "Ho",
            {
                number: 67,
                symbol: "Ho",
                mass: 164.93,
                covalentRadius: 1.92,
                vdwRadius: 2.3,
                color: "#00ff9c",
                maxValence: 6,
            },
        ],
        [
            "Er",
            {
                number: 68,
                symbol: "Er",
                mass: 167.259,
                covalentRadius: 1.89,
                vdwRadius: 2.29,
                color: "#00e675",
                maxValence: 6,
            },
        ],
        [
            "Tm",
            {
                number: 69,
                symbol: "Tm",
                mass: 168.934,
                covalentRadius: 1.9,
                vdwRadius: 2.27,
                color: "#00d452",
                maxValence: 6,
            },
        ],
        [
            "Yb",
            {
                number: 70,
                symbol: "Yb",
                mass: 173.045,
                covalentRadius: 1.87,
                vdwRadius: 2.26,
                color: "#00bf38",
                maxValence: 6,
            },
        ],
        [
            "Lu",
            {
                number: 71,
                symbol: "Lu",
                mass: 174.967,
                covalentRadius: 1.87,
                vdwRadius: 2.24,
                color: "#00ab24",
                maxValence: 6,
            },
        ],
        [
            "Hf",
            {
                number: 72,
                symbol: "Hf",
                mass: 178.49,
                covalentRadius: 1.75,
                vdwRadius: 2.23,
                color: "#4dc2ff",
                maxValence: 6,
            },
        ],
        [
            "Ta",
            {
                number: 73,
                symbol: "Ta",
                mass: 180.948,
                covalentRadius: 1.7,
                vdwRadius: 2.22,
                color: "#4da6ff",
                maxValence: 6,
            },
        ],
        [
            "W",
            {
                number: 74,
                symbol: "W",
                mass: 183.84,
                covalentRadius: 1.62,
                vdwRadius: 2.18,
                color: "#2194d6",
                maxValence: 6,
            },
        ],
        [
            "Re",
            {
                number: 75,
                symbol: "Re",
                mass: 186.207,
                covalentRadius: 1.51,
                vdwRadius: 2.16,
                color: "#267dab",
                maxValence: 6,
            },
        ],
        [
            "Os",
            {
                number: 76,
                symbol: "Os",
                mass: 190.23,
                covalentRadius: 1.44,
                vdwRadius: 2.16,
                color: "#266696",
                maxValence: 6,
            },
        ],
        [
            "Ir",
            {
                number: 77,
                symbol: "Ir",
                mass: 192.217,
                covalentRadius: 1.41,
                vdwRadius: 2.13,
                color: "#175487",
                maxValence: 6,
            },
        ],
        [
            "Au",
            {
                number: 79,
                symbol: "Au",
                mass: 196.967,
                covalentRadius: 1.36,
                vdwRadius: 2.14,
                color: "#ffd123",
                maxValence: 4,
            },
        ],
        [
            "Hg",
            {
                number: 80,
                symbol: "Hg",
                mass: 200.59,
                covalentRadius: 1.32,
                vdwRadius: 2.23,
                color: "#b8b8d0",
                maxValence: 2,
            },
        ],
        [
            "Tl",
            {
                number: 81,
                symbol: "Tl",
                mass: 204.383,
                covalentRadius: 1.45,
                vdwRadius: 2.11,
                color: "#a6544d",
                maxValence: 3,
            },
        ],
        [
            "Pb",
            {
                number: 82,
                symbol: "Pb",
                mass: 207.2,
                covalentRadius: 1.46,
                vdwRadius: 2.02,
                color: "#575961",
                maxValence: 4,
            },
        ],
        [
            "Bi",
            {
                number: 83,
                symbol: "Bi",
                mass: 208.98,
                covalentRadius: 1.48,
                vdwRadius: 2.07,
                color: "#9e4fb5",
                maxValence: 5,
            },
        ],
        [
            "Po",
            {
                number: 84,
                symbol: "Po",
                mass: 209.0,
                covalentRadius: 1.4,
                vdwRadius: 1.97,
                color: "#ab5c00",
                maxValence: 6,
            },
        ],
        [
            "At",
            {
                number: 85,
                symbol: "At",
                mass: 210.0,
                covalentRadius: 1.5,
                vdwRadius: 2.02,
                color: "#754f45",
                maxValence: 1,
            },
        ],
        [
            "Rn",
            {
                number: 86,
                symbol: "Rn",
                mass: 222.0,
                covalentRadius: 1.5,
                vdwRadius: 2.2,
                color: "#428296",
                maxValence: 0,
            },
        ],
        [
            "Fr",
            {
                number: 87,
                symbol: "Fr",
                mass: 223.0,
                covalentRadius: 2.6,
                vdwRadius: 3.48,
                color: "#420066",
                maxValence: 1,
            },
        ],
        [
            "Ra",
            {
                number: 88,
                symbol: "Ra",
                mass: 226.0,
                covalentRadius: 2.21,
                vdwRadius: 2.83,
                color: "#007c00",
                maxValence: 2,
            },
        ],
        [
            "Ac",
            {
                number: 89,
                symbol: "Ac",
                mass: 227.0,
                covalentRadius: 2.15,
                vdwRadius: 2.47,
                color: "#70abfa",
                maxValence: 6,
            },
        ],
        [
            "Th",
            {
                number: 90,
                symbol: "Th",
                mass: 232.038,
                covalentRadius: 2.06,
                vdwRadius: 2.37,
                color: "#00baff",
                maxValence: 6,
            },
        ],
        [
            "Pa",
            {
                number: 91,
                symbol: "Pa",
                mass: 231.036,
                covalentRadius: 2.0,
                vdwRadius: 2.43,
                color: "#00a1ff",
                maxValence: 6,
            },
        ],
        [
            "U",
            {
                number: 92,
                symbol: "U",
                mass: 238.029,
                covalentRadius: 1.96,
                vdwRadius: 2.4,
                color: "#008fff",
                maxValence: 6,
            },
        ],
        [
            "Np",
            {
                number: 93,
                symbol: "Np",
                mass: 237.0,
                covalentRadius: 1.9,
                vdwRadius: 2.39,
                color: "#0080ff",
                maxValence: 6,
            },
        ],
        [
            "Pu",
            {
                number: 94,
                symbol: "Pu",
                mass: 244.0,
                covalentRadius: 1.87,
                vdwRadius: 2.43,
                color: "#006bff",
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
        ["Br-Br", 2.28],
        ["I-I", 2.67],
        ["Cl-Cl", 1.99],
        ["F-F", 1.42],
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
        } else if (order === 3) {
            const tpl = table.get(a + "#" + b) ?? table.get(b + "#" + a);
            if (tpl !== undefined) {
                return tpl;
            }
        } else if (order === 1) {
            const single = table.get(key) ?? table.get(alt);
            if (single !== undefined) {
                return single;
            }
        } else if (order === 4) {
            const dbl = table.get(a + "=" + b) ?? table.get(b + "=" + a);
            if (dbl !== undefined) {
                const single = table.get(key) ?? table.get(alt);
                if (single !== undefined) {
                    return single - 0.12;
                }
            }
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
