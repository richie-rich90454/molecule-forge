export type ElementKind =
    | "alkali"
    | "alkaline"
    | "transition"
    | "post-transition"
    | "metalloid"
    | "nonmetal"
    | "halogen"
    | "noble"
    | "lanthanide"
    | "actinide";

export interface IElementChemistry {
    readonly symbol: string;
    readonly name: string;
    readonly electronegativity: number;
    readonly kind: ElementKind;
    readonly cations: ReadonlyArray<number>;
    readonly anion: number | null;
    readonly anionName: string;
}

type ChemistryRow = readonly [string, string, number, ElementKind, string, number | null, string];

const ROWS: ReadonlyArray<ChemistryRow> = [
    ["H", "Hydrogen", 2.2, "nonmetal", "1", -1, "hydride"],
    ["He", "Helium", 0, "noble", "", null, ""],
    ["Li", "Lithium", 0.98, "alkali", "1", null, ""],
    ["Be", "Beryllium", 1.57, "alkaline", "2", null, ""],
    ["B", "Boron", 2.04, "metalloid", "", -3, "boride"],
    ["C", "Carbon", 2.55, "nonmetal", "", -4, "carbide"],
    ["N", "Nitrogen", 3.04, "nonmetal", "", -3, "nitride"],
    ["O", "Oxygen", 3.44, "nonmetal", "", -2, "oxide"],
    ["F", "Fluorine", 3.98, "halogen", "", -1, "fluoride"],
    ["Ne", "Neon", 0, "noble", "", null, ""],
    ["Na", "Sodium", 0.93, "alkali", "1", null, ""],
    ["Mg", "Magnesium", 1.31, "alkaline", "2", null, ""],
    ["Al", "Aluminum", 1.61, "post-transition", "3", null, ""],
    ["Si", "Silicon", 1.9, "metalloid", "", -4, "silicide"],
    ["P", "Phosphorus", 2.19, "nonmetal", "", -3, "phosphide"],
    ["S", "Sulfur", 2.58, "nonmetal", "", -2, "sulfide"],
    ["Cl", "Chlorine", 3.16, "halogen", "", -1, "chloride"],
    ["Ar", "Argon", 0, "noble", "", null, ""],
    ["K", "Potassium", 0.82, "alkali", "1", null, ""],
    ["Ca", "Calcium", 1.0, "alkaline", "2", null, ""],
    ["Sc", "Scandium", 1.36, "transition", "3", null, ""],
    ["Ti", "Titanium", 1.54, "transition", "4,3", null, ""],
    ["V", "Vanadium", 1.63, "transition", "5,4", null, ""],
    ["Cr", "Chromium", 1.66, "transition", "3,6", null, ""],
    ["Mn", "Manganese", 1.55, "transition", "2,4,7", null, ""],
    ["Fe", "Iron", 1.83, "transition", "3,2", null, ""],
    ["Co", "Cobalt", 1.88, "transition", "2,3", null, ""],
    ["Ni", "Nickel", 1.91, "transition", "2", null, ""],
    ["Cu", "Copper", 1.9, "transition", "2,1", null, ""],
    ["Zn", "Zinc", 1.65, "transition", "2", null, ""],
    ["Ga", "Gallium", 1.81, "post-transition", "3", null, ""],
    ["Ge", "Germanium", 2.01, "metalloid", "", -4, "germanide"],
    ["As", "Arsenic", 2.18, "metalloid", "", -3, "arsenide"],
    ["Se", "Selenium", 2.55, "nonmetal", "", -2, "selenide"],
    ["Br", "Bromine", 2.96, "halogen", "", -1, "bromide"],
    ["Kr", "Krypton", 3.0, "noble", "", null, ""],
    ["Rb", "Rubidium", 0.82, "alkali", "1", null, ""],
    ["Sr", "Strontium", 0.95, "alkaline", "2", null, ""],
    ["Y", "Yttrium", 1.22, "transition", "3", null, ""],
    ["Zr", "Zirconium", 1.33, "transition", "4", null, ""],
    ["Nb", "Niobium", 1.6, "transition", "5", null, ""],
    ["Mo", "Molybdenum", 2.16, "transition", "6,4", null, ""],
    ["Tc", "Technetium", 1.9, "transition", "7,4", null, ""],
    ["Ru", "Ruthenium", 2.2, "transition", "3,4", null, ""],
    ["Rh", "Rhodium", 2.28, "transition", "3", null, ""],
    ["Pd", "Palladium", 2.2, "transition", "2,4", null, ""],
    ["Ag", "Silver", 1.93, "transition", "1", null, ""],
    ["Cd", "Cadmium", 1.69, "transition", "2", null, ""],
    ["In", "Indium", 1.78, "post-transition", "3", null, ""],
    ["Sn", "Tin", 1.96, "post-transition", "4,2", null, ""],
    ["Sb", "Antimony", 2.05, "metalloid", "", -3, "antimonide"],
    ["Te", "Tellurium", 2.1, "metalloid", "", -2, "telluride"],
    ["I", "Iodine", 2.66, "halogen", "", -1, "iodide"],
    ["Xe", "Xenon", 2.6, "noble", "", null, ""],
    ["Cs", "Cesium", 0.79, "alkali", "1", null, ""],
    ["Ba", "Barium", 0.89, "alkaline", "2", null, ""],
    ["La", "Lanthanum", 1.1, "lanthanide", "3", null, ""],
    ["Ce", "Cerium", 1.12, "lanthanide", "3,4", null, ""],
    ["Pr", "Praseodymium", 1.13, "lanthanide", "3", null, ""],
    ["Nd", "Neodymium", 1.14, "lanthanide", "3", null, ""],
    ["Pm", "Promethium", 1.13, "lanthanide", "3", null, ""],
    ["Sm", "Samarium", 1.17, "lanthanide", "3", null, ""],
    ["Eu", "Europium", 1.2, "lanthanide", "2,3", null, ""],
    ["Gd", "Gadolinium", 1.2, "lanthanide", "3", null, ""],
    ["Tb", "Terbium", 1.2, "lanthanide", "3", null, ""],
    ["Dy", "Dysprosium", 1.22, "lanthanide", "3", null, ""],
    ["Ho", "Holmium", 1.23, "lanthanide", "3", null, ""],
    ["Er", "Erbium", 1.24, "lanthanide", "3", null, ""],
    ["Tm", "Thulium", 1.25, "lanthanide", "3", null, ""],
    ["Yb", "Ytterbium", 1.1, "lanthanide", "3,2", null, ""],
    ["Lu", "Lutetium", 1.27, "lanthanide", "3", null, ""],
    ["Hf", "Hafnium", 1.3, "transition", "4", null, ""],
    ["Ta", "Tantalum", 1.5, "transition", "5", null, ""],
    ["W", "Tungsten", 2.36, "transition", "6,4", null, ""],
    ["Re", "Rhenium", 1.9, "transition", "7,4", null, ""],
    ["Os", "Osmium", 2.2, "transition", "4", null, ""],
    ["Ir", "Iridium", 2.2, "transition", "3,4", null, ""],
    ["Pt", "Platinum", 2.28, "transition", "2,4", null, ""],
    ["Au", "Gold", 2.54, "transition", "3,1", null, ""],
    ["Hg", "Mercury", 2.0, "transition", "2,1", null, ""],
    ["Tl", "Thallium", 1.62, "post-transition", "1,3", null, ""],
    ["Pb", "Lead", 2.33, "post-transition", "2,4", null, ""],
    ["Bi", "Bismuth", 2.02, "post-transition", "3,5", null, ""],
    ["Po", "Polonium", 2.0, "post-transition", "4,2", null, ""],
    ["At", "Astatine", 2.2, "halogen", "", -1, "astatide"],
    ["Rn", "Radon", 2.2, "noble", "", null, ""],
    ["Fr", "Francium", 0.7, "alkali", "1", null, ""],
    ["Ra", "Radium", 0.9, "alkaline", "2", null, ""],
    ["Ac", "Actinium", 1.1, "actinide", "3", null, ""],
    ["Th", "Thorium", 1.3, "actinide", "4", null, ""],
    ["Pa", "Protactinium", 1.5, "actinide", "5", null, ""],
    ["U", "Uranium", 1.38, "actinide", "6,4", null, ""],
    ["Np", "Neptunium", 1.36, "actinide", "5,4", null, ""],
    ["Pu", "Plutonium", 1.28, "actinide", "4,3", null, ""],
];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export class ElementChemistry {
    private static readonly TABLE: ReadonlyMap<string, IElementChemistry> = new Map(
        ROWS.map((row) => [
            row[0],
            {
                symbol: row[0],
                name: row[1],
                electronegativity: row[2],
                kind: row[3],
                cations: row[4] === "" ? [] : row[4].split(",").map((v) => parseInt(v, 10)),
                anion: row[5],
                anionName: row[6],
            },
        ]),
    );

    public static has(symbol: string): boolean {
        return ElementChemistry.TABLE.has(symbol);
    }

    public static get(symbol: string): IElementChemistry {
        const info = ElementChemistry.TABLE.get(symbol);
        if (info === undefined) {
            throw new Error("Unknown element chemistry: " + symbol);
        }
        return info;
    }

    public static getSymbols(): ReadonlyArray<string> {
        return Array.from(ElementChemistry.TABLE.keys());
    }

    public static isMetal(info: IElementChemistry): boolean {
        return (
            info.kind === "alkali" ||
            info.kind === "alkaline" ||
            info.kind === "transition" ||
            info.kind === "post-transition" ||
            info.kind === "lanthanide" ||
            info.kind === "actinide"
        );
    }

    public static isNoble(info: IElementChemistry): boolean {
        return info.kind === "noble";
    }

    public static isAnionFormer(info: IElementChemistry): boolean {
        return info.anion !== null;
    }

    public static roman(value: number): string {
        return ROMAN[value] ?? String(value);
    }

    public static cationName(symbol: string, charge: number): string {
        const info = ElementChemistry.get(symbol);
        if (info.cations.length <= 1) {
            return info.name;
        }
        return info.name + "(" + ElementChemistry.roman(charge) + ")";
    }

    public static anionName(symbol: string): string {
        return ElementChemistry.get(symbol).anionName;
    }

    public static compoundName(cation: string, cationCharge: number, anion: string): string {
        return (
            ElementChemistry.cationName(cation, cationCharge) +
            " " +
            ElementChemistry.anionName(anion)
        );
    }

    public static gcd(a: number, b: number): number {
        let x = Math.abs(a);
        let y = Math.abs(b);
        while (y !== 0) {
            const t = y;
            y = x % y;
            x = t;
        }
        return x;
    }
}
