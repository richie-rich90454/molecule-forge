import type { ICompactMoleculeSpec, IMoleculeRecord } from "./MoleculeRecord";
import { ElementChemistry } from "./ElementChemistry";
import { MoleculeFactory } from "./MoleculeFactory";

export interface IAtomPool {
    readonly totals: ReadonlyMap<string, number>;
    readonly monatomic: ReadonlyMap<string, number>;
}

export interface ISynthesisProduct {
    readonly catalogId: string | null;
    readonly record: IMoleculeRecord | null;
    readonly name: string;
    readonly formula: string;
    readonly needs: ReadonlyMap<string, number>;
    readonly units: number;
}

export interface ISynthesisPrediction {
    readonly product: ISynthesisProduct | null;
    readonly hint: string | null;
}

interface IIonicUnit {
    readonly cation: string;
    readonly cationCharge: number;
    readonly anion: string;
    readonly anionCharge: number;
    readonly cationCount: number;
    readonly anionCount: number;
}

interface ICovalentSynth {
    readonly name: string;
    readonly formula: string;
    readonly heavy: ReadonlyArray<string>;
}

const DIATOMIC_CATALOG: ReadonlyMap<string, string> = new Map([
    ["H", "hydrogen-elemental"],
    ["N", "nitrogen-elemental"],
    ["O", "oxygen-elemental"],
    ["F", "fluorine-elemental"],
    ["Cl", "chlorine-elemental"],
    ["Br", "bromine"],
    ["I", "iodine"],
]);

const COVALENT_CATALOG: ReadonlyMap<string, string> = new Map([
    ["Cl,H", "hydrogen-chloride"],
    ["Br,H", "hydrogen-bromide"],
    ["H,H,O", "water"],
    ["H,H,H,N", "ammonia"],
    ["C,O,O", "carbon-dioxide"],
    ["O,O,S", "sulfur-dioxide"],
    ["N,O,O", "nitrogen-dioxide"],
    ["H,H,S", "hydrogen-sulfide"],
    ["C,O", "carbon-monoxide"],
]);

const COVALENT_SYNTH: ReadonlyMap<string, ICovalentSynth> = new Map([
    ["F,H", { name: "Hydrogen fluoride", formula: "HF", heavy: ["H", "F"] }],
]);

function reactiveKey(totals: ReadonlyMap<string, number>): string {
    const parts: string[] = [];
    for (const [symbol, count] of totals) {
        if (count <= 0 || !ElementChemistry.has(symbol)) {
            continue;
        }
        if (ElementChemistry.isNoble(ElementChemistry.get(symbol))) {
            continue;
        }
        for (let i = 0; i < count; i++) {
            parts.push(symbol);
        }
    }
    return parts.sort().join(",");
}

export class CompoundSynthesizer {
    private readonly factory: MoleculeFactory;
    private readonly cache: Map<string, IMoleculeRecord>;

    public constructor(factory: MoleculeFactory = new MoleculeFactory()) {
        this.factory = factory;
        this.cache = new Map();
    }

    public predict(pool: IAtomPool): ISynthesisPrediction {
        const ionic = this.predictIonic(pool.totals);
        if (ionic !== null) {
            return { product: ionic, hint: null };
        }
        const covalent = this.predictCovalent(pool.totals);
        if (covalent !== null) {
            return { product: covalent, hint: null };
        }
        const diatomic = this.predictDiatomic(pool.monatomic);
        if (diatomic !== null) {
            return { product: diatomic, hint: null };
        }
        return { product: null, hint: this.buildHint(pool.totals) };
    }

    private bestIonicUnit(
        totals: ReadonlyMap<string, number>,
    ): { unit: IIonicUnit; units: number; waste: number; polarity: number } | null {
        let best: { unit: IIonicUnit; units: number; waste: number; polarity: number } | null =
            null;
        for (const [cationSymbol, cationAvailable] of totals) {
            if (cationAvailable <= 0 || !ElementChemistry.has(cationSymbol)) {
                continue;
            }
            const cationInfo = ElementChemistry.get(cationSymbol);
            if (!ElementChemistry.isMetal(cationInfo)) {
                continue;
            }
            for (const charge of cationInfo.cations) {
                for (const [anionSymbol, anionAvailable] of totals) {
                    if (anionSymbol === cationSymbol || anionAvailable <= 0) {
                        continue;
                    }
                    if (!ElementChemistry.has(anionSymbol)) {
                        continue;
                    }
                    const anionInfo = ElementChemistry.get(anionSymbol);
                    if (anionInfo.anion === null) {
                        continue;
                    }
                    const anionCharge = Math.abs(anionInfo.anion);
                    const g = ElementChemistry.gcd(charge, anionCharge);
                    const cationCount = anionCharge / g;
                    const anionCount = charge / g;
                    const units = Math.min(
                        Math.floor(cationAvailable / cationCount),
                        Math.floor(anionAvailable / anionCount),
                    );
                    const waste =
                        cationAvailable -
                        units * cationCount +
                        (anionAvailable - units * anionCount);
                    const polarity = anionInfo.electronegativity - cationInfo.electronegativity;
                    const better =
                        best === null ||
                        waste < best.waste ||
                        (waste === best.waste &&
                            (units > best.units ||
                                (units === best.units && polarity > best.polarity)));
                    if (better) {
                        best = {
                            unit: {
                                cation: cationSymbol,
                                cationCharge: charge,
                                anion: anionSymbol,
                                anionCharge,
                                cationCount,
                                anionCount,
                            },
                            units,
                            waste,
                            polarity,
                        };
                    }
                }
            }
        }
        return best;
    }

    private predictIonic(totals: ReadonlyMap<string, number>): ISynthesisProduct | null {
        const best = this.bestIonicUnit(totals);
        if (best === null || best.units < 1) {
            return null;
        }
        return this.buildIonic(best.unit, best.units);
    }

    private predictDiatomic(monatomic: ReadonlyMap<string, number>): ISynthesisProduct | null {
        for (const [symbol, count] of monatomic) {
            const catalogId = DIATOMIC_CATALOG.get(symbol);
            if (catalogId === undefined || count < 2) {
                continue;
            }
            return {
                catalogId,
                record: null,
                name: ElementChemistry.get(symbol).name,
                formula: symbol + "2",
                needs: new Map([[symbol, 2]]),
                units: Math.floor(count / 2),
            };
        }
        return null;
    }

    private predictCovalent(totals: ReadonlyMap<string, number>): ISynthesisProduct | null {
        const key = reactiveKey(totals);
        const needs = new Map<string, number>();
        for (const symbol of key.split(",")) {
            if (symbol === "") {
                continue;
            }
            needs.set(symbol, (needs.get(symbol) ?? 0) + 1);
        }
        const catalogId = COVALENT_CATALOG.get(key);
        if (catalogId !== undefined) {
            return { catalogId, record: null, name: "", formula: key, needs, units: 1 };
        }
        const synth = COVALENT_SYNTH.get(key);
        if (synth === undefined) {
            return null;
        }
        const bonds: Array<readonly [number, number, number]> = [];
        for (let i = 1; i < synth.heavy.length; i++) {
            bonds.push([0, i, 1]);
        }
        const record = this.buildRecord(
            "synth-" + synth.formula.toLowerCase(),
            synth.name,
            synth.formula,
            synth.heavy,
            bonds,
            [],
        );
        return {
            catalogId: null,
            record,
            name: synth.name,
            formula: synth.formula,
            needs,
            units: 1,
        };
    }

    private buildHint(totals: ReadonlyMap<string, number>): string | null {
        const best = this.bestIonicUnit(totals);
        if (best === null) {
            return null;
        }
        const unit = best.unit;
        const name = ElementChemistry.compoundName(unit.cation, unit.cationCharge, unit.anion);
        return (
            name +
            " needs " +
            unit.cationCount +
            " " +
            unit.cation +
            " and " +
            unit.anionCount +
            " " +
            unit.anion +
            " per unit. Add more " +
            unit.anion +
            "."
        );
    }

    private buildIonic(unit: IIonicUnit, units: number): ISynthesisProduct {
        const heavy: string[] = [];
        for (let i = 0; i < unit.cationCount; i++) {
            heavy.push(unit.cation);
        }
        for (let i = 0; i < unit.anionCount; i++) {
            heavy.push(unit.anion);
        }
        const bonds: Array<readonly [number, number, number]> = [];
        for (let c = 0; c < unit.cationCount; c++) {
            for (let a = unit.cationCount; a < heavy.length; a++) {
                bonds.push([c, a, 1]);
            }
        }
        const charges: Array<readonly [number, number]> = [];
        for (let i = 0; i < unit.cationCount; i++) {
            charges.push([i, unit.cationCharge]);
        }
        for (let i = unit.cationCount; i < heavy.length; i++) {
            charges.push([i, -unit.anionCharge]);
        }
        const formula =
            unit.cation +
            (unit.cationCount > 1 ? unit.cationCount : "") +
            unit.anion +
            (unit.anionCount > 1 ? unit.anionCount : "");
        const name = ElementChemistry.compoundName(unit.cation, unit.cationCharge, unit.anion);
        const record = this.buildRecord(
            "synth-" + formula.toLowerCase(),
            name,
            formula,
            heavy,
            bonds,
            charges,
        );
        const needs = new Map<string, number>([
            [unit.cation, unit.cationCount],
            [unit.anion, unit.anionCount],
        ]);
        return { catalogId: null, record, name, formula, needs, units };
    }

    private buildRecord(
        id: string,
        name: string,
        formula: string,
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<readonly [number, number, number]>,
        charges: ReadonlyArray<readonly [number, number]>,
    ): IMoleculeRecord {
        const cached = this.cache.get(id);
        if (cached !== undefined) {
            return cached;
        }
        const spec: ICompactMoleculeSpec = {
            id,
            name,
            formula,
            smiles: "",
            category: "functional",
            tags: ["compound", "synthesized"],
            warn: false,
            inchi: "",
            heavy,
            bonds,
            charges,
            explicitH: [],
        };
        const record = this.factory.build(spec);
        this.cache.set(id, record);
        return record;
    }
}
