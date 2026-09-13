export interface IRedoxCouple {
    readonly id: string;
    readonly element: string;
    readonly oxidizedCharge: number;
    readonly potential: number;
}

const ATOM = new Map<string, number>([
    ["H", 218],
    ["He", 0],
    ["Li", 159],
    ["Be", 324],
    ["B", 565],
    ["C", 717],
    ["N", 473],
    ["O", 249],
    ["F", 79],
    ["Ne", 0],
    ["Na", 107],
    ["Mg", 148],
    ["Al", 330],
    ["Si", 450],
    ["P", 317],
    ["S", 279],
    ["Cl", 121],
    ["Ar", 0],
    ["K", 89],
    ["Ca", 178],
    ["Sc", 378],
    ["Ti", 473],
    ["V", 515],
    ["Cr", 397],
    ["Mn", 281],
    ["Fe", 416],
    ["Co", 425],
    ["Ni", 430],
    ["Cu", 338],
    ["Zn", 130],
    ["Ga", 277],
    ["Ge", 372],
    ["As", 302],
    ["Se", 227],
    ["Br", 112],
    ["Kr", 0],
    ["Rb", 81],
    ["Sr", 164],
    ["Y", 424],
    ["Zr", 609],
    ["Nb", 725],
    ["Mo", 658],
    ["Tc", 677],
    ["Ru", 642],
    ["Rh", 556],
    ["Pd", 376],
    ["Ag", 284],
    ["Cd", 112],
    ["In", 243],
    ["Sn", 302],
    ["Sb", 262],
    ["Te", 197],
    ["I", 107],
    ["Xe", 0],
    ["Cs", 76],
    ["Ba", 180],
    ["La", 431],
    ["Ce", 423],
    ["Pr", 356],
    ["Nd", 328],
    ["Pm", 350],
    ["Sm", 206],
    ["Eu", 175],
    ["Gd", 397],
    ["Tb", 389],
    ["Dy", 290],
    ["Ho", 301],
    ["Er", 317],
    ["Tm", 232],
    ["Yb", 152],
    ["Lu", 428],
    ["Hf", 619],
    ["Ta", 782],
    ["W", 849],
    ["Re", 769],
    ["Os", 791],
    ["Ir", 665],
    ["Pt", 565],
    ["Au", 366],
    ["Hg", 61],
    ["Tl", 182],
    ["Pb", 195],
    ["Bi", 207],
    ["Po", 146],
    ["At", 92],
    ["Rn", 0],
    ["Fr", 72],
    ["Ra", 159],
    ["Ac", 406],
    ["Th", 602],
    ["Pa", 607],
    ["U", 536],
    ["Np", 465],
    ["Pu", 352],
]);

const IONIZATION: ReadonlyMap<string, ReadonlyArray<number>> = new Map([
    ["H", [1312]],
    ["Li", [520, 7298]],
    ["Be", [899, 1757]],
    ["B", [801, 2427]],
    ["C", [1086, 2353]],
    ["N", [1402, 2856]],
    ["O", [1314, 3388]],
    ["F", [1681, 3374]],
    ["Na", [496, 4562]],
    ["Mg", [738, 1451]],
    ["Al", [578, 1817, 2745]],
    ["Si", [787, 1577]],
    ["P", [1012, 1900]],
    ["S", [1000, 2251]],
    ["Cl", [1251, 2298]],
    ["K", [419, 3052]],
    ["Ca", [590, 1145]],
    ["Sc", [633, 1235, 2389]],
    ["Ti", [659, 1310, 2652]],
    ["V", [651, 1414, 2830]],
    ["Cr", [653, 1591, 2987]],
    ["Mn", [717, 1509, 3248]],
    ["Fe", [762, 1561, 2957]],
    ["Co", [760, 1648, 3232]],
    ["Ni", [737, 1753, 3395]],
    ["Cu", [745, 1958]],
    ["Zn", [906, 1733]],
    ["Ga", [579, 1979, 2963]],
    ["Ge", [762, 1537]],
    ["As", [947, 1798, 2735]],
    ["Se", [941, 2045, 2974]],
    ["Br", [1140, 2103]],
    ["Rb", [403, 2633]],
    ["Sr", [550, 1064]],
    ["Y", [600, 1180, 1980]],
    ["Zr", [640, 1270, 2218]],
    ["Nb", [652, 1380]],
    ["Mo", [684, 1560]],
    ["Ag", [731, 2072]],
    ["Cd", [868, 1631]],
    ["In", [558, 1821, 2704]],
    ["Sn", [709, 1411, 2943]],
    ["Sb", [834, 1595, 2440]],
    ["Te", [869, 1795, 2600]],
    ["I", [1008, 1846]],
    ["Cs", [376, 2233]],
    ["Ba", [503, 965]],
    ["La", [538, 1067, 1850]],
    ["Ce", [534, 1047, 1949]],
    ["Pr", [527, 1010, 2086]],
    ["Nd", [533, 1035, 2130]],
    ["Sm", [545, 1074, 2260]],
    ["Eu", [547, 1085, 2404]],
    ["Gd", [593, 1170, 1990]],
    ["Tb", [566, 1108, 2114]],
    ["Dy", [573, 1135, 2200]],
    ["Ho", [581, 1155, 2260]],
    ["Er", [589, 1180, 2310]],
    ["Tm", [597, 1194, 2360]],
    ["Yb", [603, 1204, 2417]],
    ["Lu", [524, 1342, 2054]],
    ["Hf", [659, 1440, 2250]],
    ["Ta", [761, 1560]],
    ["W", [770, 1710]],
    ["Re", [760, 1600]],
    ["Os", [840, 1600]],
    ["Ir", [880, 1600]],
    ["Pt", [870, 1790]],
    ["Au", [890, 1980]],
    ["Hg", [1007, 1810]],
    ["Tl", [589, 1971, 2878]],
    ["Pb", [716, 1450, 3081]],
    ["Bi", [703, 1610, 2460]],
    ["Ra", [509, 979]],
    ["Ac", [499, 1170]],
    ["Th", [587, 1110]],
    ["U", [598, 1164]],
]);

const ELECTRON_AFFINITY: ReadonlyMap<string, number> = new Map([
    ["H", 73],
    ["B", 27],
    ["C", 122],
    ["O", 141],
    ["F", 328],
    ["Si", 134],
    ["P", 72],
    ["S", 200],
    ["Cl", 349],
    ["Ge", 119],
    ["As", 78],
    ["Se", 195],
    ["Br", 325],
    ["Sb", 103],
    ["Te", 190],
    ["I", 295],
    ["Au", 223],
]);

const SECOND_ELECTRON_AFFINITY: ReadonlyMap<string, number> = new Map([
    ["O", -780],
    ["S", -590],
    ["Se", -496],
    ["Te", -420],
]);

const BOND: ReadonlyMap<string, number> = new Map([
    ["H-H", 436],
    ["F-F", 158],
    ["Cl-Cl", 243],
    ["Br-Br", 193],
    ["I-I", 151],
    ["N-N", 163],
    ["N=N", 418],
    ["N#N", 945],
    ["O-O", 146],
    ["O=O", 498],
    ["S-S", 266],
    ["P-P", 201],
    ["C-H", 413],
    ["C-C", 347],
    ["C=C", 614],
    ["C#C", 839],
    ["C-O", 358],
    ["C=O", 745],
    ["C#O", 1072],
    ["C-N", 305],
    ["C=N", 615],
    ["C#N", 891],
    ["C-F", 485],
    ["C-Cl", 339],
    ["C-Br", 285],
    ["C-I", 213],
    ["H-O", 463],
    ["H-N", 391],
    ["H-F", 568],
    ["H-Cl", 431],
    ["H-Br", 366],
    ["H-I", 299],
    ["H-S", 347],
    ["H-P", 322],
    ["N-O", 201],
    ["N=O", 607],
    ["N-O2", 300],
    ["S=O", 522],
    ["S-O", 265],
    ["Cl-O", 218],
    ["Xe-F", 130],
    ["Kr-F", 96],
    ["Rn-F", 110],
]);

const IONIC_RADIUS: ReadonlyMap<string, number> = new Map([
    ["Li+", 0.76],
    ["Na+", 1.02],
    ["K+", 1.38],
    ["Rb+", 1.52],
    ["Cs+", 1.67],
    ["Be2+", 0.45],
    ["Mg2+", 0.72],
    ["Ca2+", 1.0],
    ["Sr2+", 1.18],
    ["Ba2+", 1.35],
    ["Ra2+", 1.48],
    ["Al3+", 0.535],
    ["Sc3+", 0.745],
    ["Y3+", 0.9],
    ["La3+", 1.032],
    ["Ce3+", 1.01],
    ["Fe2+", 0.78],
    ["Fe3+", 0.645],
    ["Co2+", 0.745],
    ["Ni2+", 0.69],
    ["Cu2+", 0.73],
    ["Zn2+", 0.74],
    ["Mn2+", 0.83],
    ["Cd2+", 0.95],
    ["Hg2+", 1.02],
    ["Ag+", 1.15],
    ["Pb2+", 1.19],
    ["Sn2+", 1.18],
    ["NH4+", 1.48],
    ["H+", 0.38],
    ["F-", 1.33],
    ["Cl-", 1.81],
    ["Br-", 1.96],
    ["I-", 2.2],
    ["O2-", 1.4],
    ["S2-", 1.84],
    ["Se2-", 1.98],
    ["Te2-", 2.21],
    ["N3-", 1.46],
    ["P3-", 2.12],
    ["H-", 1.54],
    ["OH-", 1.37],
    ["CN-", 1.91],
    ["NO3-", 1.79],
    ["CO3 2-", 1.78],
    ["SO4 2-", 2.3],
    ["SO3 2-", 2.0],
    ["PO4 3-", 2.38],
    ["ClO4-", 2.4],
    ["ClO3-", 2.0],
    ["ClO-", 1.7],
    ["CH3COO-", 2.32],
    ["MnO4-", 2.4],
    ["CrO4 2-", 2.4],
]);

const MOLECULE: ReadonlyMap<string, number> = new Map([
    ["hydrogen-elemental", 0],
    ["nitrogen-elemental", 0],
    ["oxygen-elemental", 0],
    ["fluorine-elemental", 0],
    ["chlorine-elemental", 0],
    ["bromine", 30.9],
    ["iodine", 62.4],
    ["water", -241.8],
    ["hydrogen-peroxide", -136.3],
    ["ammonia", -45.9],
    ["alkane-c1", -74.8],
    ["carbon-dioxide", -393.5],
    ["carbon-monoxide", -110.5],
    ["nitrous-oxide", 82.1],
    ["sulfur-dioxide", -296.8],
    ["nitrogen-dioxide", 33.2],
    ["hydrogen-sulfide", -20.6],
    ["hydrogen-chloride", -92.3],
    ["hydrogen-bromide", -36.3],
    ["sulfur-s8", 102.5],
    ["HF", -271.1],
    ["P4", 58.9],
    ["XeF2", -107.5],
    ["XeF4", -251.0],
    ["XeF6", -359.0],
]);

const REDUCTION: ReadonlyArray<IRedoxCouple> = [
    { id: "F2/F-", element: "F", oxidizedCharge: 0, potential: 2.87 },
    { id: "Cl2/Cl-", element: "Cl", oxidizedCharge: 0, potential: 1.36 },
    { id: "Br2/Br-", element: "Br", oxidizedCharge: 0, potential: 1.07 },
    { id: "I2/I-", element: "I", oxidizedCharge: 0, potential: 0.54 },
    { id: "Au3+/Au", element: "Au", oxidizedCharge: 3, potential: 1.5 },
    { id: "Ag+/Ag", element: "Ag", oxidizedCharge: 1, potential: 0.8 },
    { id: "Hg2+/Hg", element: "Hg", oxidizedCharge: 2, potential: 0.85 },
    { id: "Cu2+/Cu", element: "Cu", oxidizedCharge: 2, potential: 0.34 },
    { id: "Cu+/Cu", element: "Cu", oxidizedCharge: 1, potential: 0.52 },
    { id: "Pb2+/Pb", element: "Pb", oxidizedCharge: 2, potential: -0.13 },
    { id: "Sn2+/Sn", element: "Sn", oxidizedCharge: 2, potential: -0.14 },
    { id: "Ni2+/Ni", element: "Ni", oxidizedCharge: 2, potential: -0.26 },
    { id: "Co2+/Co", element: "Co", oxidizedCharge: 2, potential: -0.28 },
    { id: "Cd2+/Cd", element: "Cd", oxidizedCharge: 2, potential: -0.4 },
    { id: "Fe2+/Fe", element: "Fe", oxidizedCharge: 2, potential: -0.44 },
    { id: "Cr3+/Cr", element: "Cr", oxidizedCharge: 3, potential: -0.74 },
    { id: "Zn2+/Zn", element: "Zn", oxidizedCharge: 2, potential: -0.76 },
    { id: "Mn2+/Mn", element: "Mn", oxidizedCharge: 2, potential: -1.18 },
    { id: "Al3+/Al", element: "Al", oxidizedCharge: 3, potential: -1.66 },
    { id: "Mg2+/Mg", element: "Mg", oxidizedCharge: 2, potential: -2.37 },
    { id: "Na+/Na", element: "Na", oxidizedCharge: 1, potential: -2.71 },
    { id: "Ca2+/Ca", element: "Ca", oxidizedCharge: 2, potential: -2.87 },
    { id: "K+/K", element: "K", oxidizedCharge: 1, potential: -2.93 },
    { id: "Li+/Li", element: "Li", oxidizedCharge: 1, potential: -3.04 },
];

export class Thermochemistry {
    public static atomization(symbol: string): number | null {
        return ATOM.get(symbol) ?? null;
    }

    public static bondEnergy(a: string, b: string, order: number): number | null {
        const forward = a + (order === 1 ? "-" : order === 2 ? "=" : order === 3 ? "#" : "-") + b;
        const reverse = b + (order === 1 ? "-" : order === 2 ? "=" : order === 3 ? "#" : "-") + a;
        return BOND.get(forward) ?? BOND.get(reverse) ?? null;
    }

    public static covalentEnthalpy(
        bonds: ReadonlyArray<{ a: string; b: string; order: number }>,
    ): number | null {
        let total = 0;
        for (const bond of bonds) {
            const energy = Thermochemistry.bondEnergy(bond.a, bond.b, bond.order);
            if (energy === null) {
                return null;
            }
            total -= energy;
        }
        return total;
    }

    public static moleculeEnthalpy(idOrFormula: string): number | null {
        return MOLECULE.get(idOrFormula) ?? null;
    }

    public static reactionEnthalpy(
        consumed: ReadonlyMap<string, number>,
        productEnthalpy: number | null,
        units: number,
    ): number | null {
        if (productEnthalpy === null) {
            return null;
        }
        let reactant = 0;
        for (const [symbol, count] of consumed) {
            const atom = ATOM.get(symbol);
            if (atom === undefined) {
                return null;
            }
            reactant += atom * count;
        }
        return productEnthalpy * units - reactant;
    }

    public static gaseousCationEnthalpy(symbol: string, charge: number): number | null {
        const atom = ATOM.get(symbol);
        const ionizations = IONIZATION.get(symbol);
        if (atom === undefined || ionizations === undefined || charge < 1) {
            return null;
        }
        if (ionizations.length < charge) {
            return null;
        }
        let total = atom;
        for (let i = 0; i < charge; i++) {
            total += ionizations[i];
        }
        return total;
    }

    public static gaseousAnionEnthalpy(symbol: string, charge: number): number | null {
        const atom = ATOM.get(symbol);
        const first = ELECTRON_AFFINITY.get(symbol);
        if (atom === undefined || first === undefined || charge > 2) {
            return null;
        }
        let total = atom - first;
        if (charge === 2) {
            const second = SECOND_ELECTRON_AFFINITY.get(symbol);
            if (second === undefined) {
                return null;
            }
            total -= second;
        }
        return total;
    }

    public static latticeEnergy(
        cationCharge: number,
        anionCharge: number,
        cationRadius: number,
        anionRadius: number,
    ): number {
        const sum = cationRadius + anionRadius;
        const k = 1.2025e-4;
        const d = 3.45e-11;
        const r = sum * 1e-10;
        return (((k * 2 * cationCharge * anionCharge) / r) * (1 - d / r)) / 1000;
    }

    public static ionicFormationEnthalpy(
        cation: string,
        cationCharge: number,
        anion: string,
        anionCharge: number,
    ): number | null {
        const cationGas = Thermochemistry.gaseousCationEnthalpy(cation, cationCharge);
        const anionGas = Thermochemistry.gaseousAnionEnthalpy(anion, anionCharge);
        const cationRadius = Thermochemistry.ionicRadiusOf(cation, cationCharge);
        const anionRadius = Thermochemistry.ionicRadiusOf(anion, -Math.abs(anionCharge));
        if (
            cationGas === null ||
            anionGas === null ||
            cationRadius === null ||
            anionRadius === null
        ) {
            return null;
        }
        const lattice = Thermochemistry.latticeEnergy(
            cationCharge,
            anionCharge,
            cationRadius,
            anionRadius,
        );
        return cationGas + anionGas - lattice;
    }

    public static ionicRadiusOf(symbol: string, charge: number): number | null {
        const suffix =
            charge > 0
                ? charge === 1
                    ? "+"
                    : charge + "+"
                : charge === -1
                  ? "-"
                  : Math.abs(charge) + "-";
        return IONIC_RADIUS.get(symbol + suffix) ?? null;
    }

    public static debyeHuckelActivity(chargeProduct: number, ionicStrength: number): number {
        const root = Math.sqrt(Math.max(0, ionicStrength));
        return Math.pow(10, (-0.509 * Math.abs(chargeProduct) * root) / (1 + root));
    }

    public static reductionCouple(element: string, charge: number): IRedoxCouple | null {
        for (const couple of REDUCTION) {
            if (couple.element === element && couple.oxidizedCharge === charge) {
                return couple;
            }
        }
        return null;
    }

    public static hasCouple(element: string): boolean {
        return REDUCTION.some((couple) => couple.element === element);
    }

    public static cellPotential(oxidizedElement: string, reducedElement: string): number | null {
        const reduced = REDUCTION.find((c) => c.element === reducedElement);
        const oxidized = REDUCTION.find((c) => c.element === oxidizedElement);
        if (reduced === undefined || oxidized === undefined) {
            return null;
        }
        return reduced.potential - oxidized.potential;
    }

    public static couples(): ReadonlyArray<IRedoxCouple> {
        return REDUCTION;
    }
}
