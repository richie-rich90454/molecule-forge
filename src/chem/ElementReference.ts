import { ElementChemistry, type IElementChemistry } from "./ElementChemistry";
import { ElementRegistry, type IElementInfo } from "./ElementRegistry";

export interface IElementReference {
    readonly number: number;
    readonly symbol: string;
    readonly name: string;
    readonly mass: number;
    readonly covalentRadius: number;
    readonly vdwRadius: number;
    readonly color: string;
    readonly maxValence: number;
    readonly electronegativity: number;
    readonly kind: string;
    readonly cations: ReadonlyArray<number>;
    readonly anion: number | null;
    readonly anionName: string;
    readonly period: number;
    readonly group: number;
    readonly fBlock: boolean;
}

export interface IReferenceEntry {
    readonly label: string;
    readonly detail: string;
}

export interface IReferenceData {
    readonly elements: ReadonlyArray<IElementReference>;
    readonly constants: ReadonlyArray<IReferenceEntry>;
    readonly equations: ReadonlyArray<IReferenceEntry>;
}

export interface INomenclature {
    readonly formula: string;
    readonly name: string;
}

export class ElementReference {
    public static elements(): IElementReference[] {
        const result: IElementReference[] = [];
        for (const symbol of ElementRegistry.getSymbols()) {
            const info: IElementInfo = ElementRegistry.get(symbol);
            const chemistry: IElementChemistry = ElementChemistry.get(symbol);
            const position = ElementReference.position(info.number);
            result.push({
                number: info.number,
                symbol: info.symbol,
                name: chemistry.name,
                mass: info.mass,
                covalentRadius: info.covalentRadius,
                vdwRadius: info.vdwRadius,
                color: info.color,
                maxValence: info.maxValence,
                electronegativity: chemistry.electronegativity,
                kind: chemistry.kind,
                cations: chemistry.cations,
                anion: chemistry.anion,
                anionName: chemistry.anionName,
                period: position.period,
                group: position.group,
                fBlock: position.fBlock,
            });
        }
        return result;
    }

    public static position(number: number): { period: number; group: number; fBlock: boolean } {
        if (number === 1) {
            return { period: 1, group: 1, fBlock: false };
        }
        if (number === 2) {
            return { period: 1, group: 18, fBlock: false };
        }
        if (number <= 10) {
            return { period: 2, group: number <= 4 ? number - 2 : number + 8, fBlock: false };
        }
        if (number <= 18) {
            return { period: 3, group: number <= 12 ? number - 10 : number, fBlock: false };
        }
        if (number <= 36) {
            return { period: 4, group: number - 18, fBlock: false };
        }
        if (number <= 54) {
            return { period: 5, group: number - 36, fBlock: false };
        }
        if (number <= 56) {
            return { period: 6, group: number - 54, fBlock: false };
        }
        if (number <= 71) {
            return { period: 6, group: 3, fBlock: true };
        }
        if (number <= 86) {
            return { period: 6, group: number - 68, fBlock: false };
        }
        if (number <= 88) {
            return { period: 7, group: number - 86, fBlock: false };
        }
        if (number <= 103) {
            return { period: 7, group: 3, fBlock: true };
        }
        return { period: 7, group: number - 100, fBlock: false };
    }

    public static periodTrend(
        elements: ReadonlyArray<IElementReference>,
        period: number,
    ): IElementReference[] {
        return elements
            .filter((element) => element.period === period && !element.fBlock)
            .sort((a, b) => a.group - b.group);
    }

    public static nomenclature(
        cation: IElementReference,
        cationCharge: number,
        anion: IElementReference,
    ): INomenclature {
        const anionCharge = Math.abs(anion.anion as number);
        const divisor = ElementChemistry.gcd(cationCharge, anionCharge);
        const cationCount = anionCharge / divisor;
        const anionCount = cationCharge / divisor;
        let formula = cation.symbol;
        if (cationCount > 1) {
            formula += cationCount;
        }
        formula += anion.symbol;
        if (anionCount > 1) {
            formula += anionCount;
        }
        return {
            formula,
            name: ElementChemistry.compoundName(cation.symbol, cationCharge, anion.symbol),
        };
    }

    public static constants(): IReferenceEntry[] {
        return [
            { label: "Gas constant R", detail: "8.314 J/(mol·K)" },
            { label: "Avogadro constant", detail: "6.022 x 10^23 /mol" },
            { label: "Boltzmann constant", detail: "1.381 x 10^-23 J/K" },
            { label: "Standard pressure", detail: "1 bar = 100 kPa" },
            { label: "Molar volume (STP)", detail: "22.4 L/mol at 273 K, 1 atm" },
            { label: "Water autoionization", detail: "Kw = 1.0 x 10^-14 at 298 K" },
            { label: "Faraday constant", detail: "96,485 C/mol" },
        ];
    }

    public static equations(): IReferenceEntry[] {
        return [
            { label: "Ideal gas law", detail: "P V = n R T" },
            { label: "Gibbs energy", detail: "G = H - T S" },
            { label: "Reaction quotient", detail: "G = G0 + R T ln Q" },
            { label: "Equilibrium", detail: "G0 = -R T ln K" },
            { label: "Arrhenius rate", detail: "k = A exp(-Ea / R T)" },
            { label: "Nernst equation", detail: "E = E0 - (R T / n F) ln Q" },
            { label: "pH", detail: "pH = -log10[H+]" },
            { label: "Molarity", detail: "M = mol solute / L solution" },
            { label: "Beer-Lambert", detail: "A = epsilon b c" },
        ];
    }
}
