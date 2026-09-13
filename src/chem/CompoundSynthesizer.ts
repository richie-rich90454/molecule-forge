import type { ICompactMoleculeSpec, IMoleculeRecord } from "./MoleculeRecord";
import { ElementChemistry } from "./ElementChemistry";
import { MoleculeFactory } from "./MoleculeFactory";
import { PolyatomicIons, type IIonSpec } from "./PolyatomicIons";

export type SynthesisKind = "ionic" | "covalent" | "elemental";

export interface IAtomPool {
    readonly totals: ReadonlyMap<string, number>;
    readonly monatomic: ReadonlyMap<string, number>;
}

export interface ISynthesisProduct {
    readonly kind: SynthesisKind;
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

interface ICovalentSynth {
    readonly name: string;
    readonly formula: string;
    readonly heavy: ReadonlyArray<string>;
    readonly bonds?: ReadonlyArray<readonly [number, number, number]>;
}

interface IAllotrope {
    readonly count: number;
    readonly catalogId: string | null;
    readonly synth: ICovalentSynth | null;
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

const ALLOTROPES: ReadonlyMap<string, IAllotrope> = new Map([
    ["S", { count: 8, catalogId: "sulfur-s8", synth: null }],
    [
        "P",
        {
            count: 4,
            catalogId: null,
            synth: {
                name: "Tetraphosphorus",
                formula: "P4",
                heavy: ["P", "P", "P", "P"],
                bonds: [
                    [0, 1, 1],
                    [0, 2, 1],
                    [0, 3, 1],
                    [1, 2, 1],
                    [1, 3, 1],
                    [2, 3, 1],
                ],
            },
        },
    ],
]);

const COVALENT_CATALOG: ReadonlyMap<string, string> = new Map([
    ["Cl,H", "hydrogen-chloride"],
    ["Br,H", "hydrogen-bromide"],
    ["H,H,O", "water"],
    ["H,H,H,N", "ammonia"],
    ["C,H,H,H,H", "alkane-c1"],
    ["C,O,O", "carbon-dioxide"],
    ["C,O", "carbon-monoxide"],
    ["N,N,O", "nitrous-oxide"],
    ["O,O,S", "sulfur-dioxide"],
    ["N,O,O", "nitrogen-dioxide"],
    ["H,H,S", "hydrogen-sulfide"],
    ["H,H,O,O", "hydrogen-peroxide"],
]);

const COVALENT_SYNTH: ReadonlyMap<string, ICovalentSynth> = new Map([
    ["F,H", { name: "Hydrogen fluoride", formula: "HF", heavy: ["H", "F"] }],
    ["F,F,Xe", { name: "Xenon difluoride", formula: "XeF2", heavy: ["Xe", "F", "F"] }],
    [
        "F,F,F,F,Xe",
        { name: "Xenon tetrafluoride", formula: "XeF4", heavy: ["Xe", "F", "F", "F", "F"] },
    ],
    [
        "F,F,F,F,F,F,Xe",
        {
            name: "Xenon hexafluoride",
            formula: "XeF6",
            heavy: ["Xe", "F", "F", "F", "F", "F", "F"],
        },
    ],
    ["F,F,Kr", { name: "Krypton difluoride", formula: "KrF2", heavy: ["Kr", "F", "F"] }],
    ["F,F,Rn", { name: "Radon difluoride", formula: "RnF2", heavy: ["Rn", "F", "F"] }],
]);

function keyCounts(key: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const symbol of key.split(",")) {
        counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    }
    return counts;
}

function matchMultiplier(
    entry: ReadonlyMap<string, number>,
    reactive: ReadonlyMap<string, number>,
): number | null {
    if (entry.size !== reactive.size) {
        return null;
    }
    let multiplier = -1;
    for (const [symbol, need] of entry) {
        const available = reactive.get(symbol);
        if (available === undefined || available < need || available % need !== 0) {
            return null;
        }
        const current = available / need;
        if (multiplier === -1) {
            multiplier = current;
        } else if (current !== multiplier) {
            return null;
        }
    }
    return multiplier;
}

interface IIonicCandidate {
    readonly cation: IIonSpec;
    readonly anion: IIonSpec;
    readonly cationCount: number;
    readonly anionCount: number;
    readonly units: number;
    readonly perUnit: Map<string, number>;
    readonly needs: Map<string, number>;
    readonly atoms: number;
    readonly chargeProduct: number;
    readonly score: number;
    readonly name: string;
    readonly formula: string;
}

function isPolyatomic(ion: IIonSpec): boolean {
    return ion.heavy.length > 1 || ion.explicitH.length > 0;
}

function groupFormula(ion: IIonSpec, count: number): string {
    if (count <= 1) {
        return ion.formula;
    }
    if (isPolyatomic(ion)) {
        return "(" + ion.formula + ")" + count;
    }
    return ion.formula + count;
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
        const elemental = this.predictElemental(pool.monatomic);
        if (elemental !== null) {
            return { product: elemental, hint: null };
        }
        return { product: null, hint: this.buildHint(pool.totals) };
    }

    private predictIonic(totals: ReadonlyMap<string, number>): ISynthesisProduct | null {
        const candidates = this.ionicCandidates(totals);
        let best: IIonicCandidate | null = null;
        for (const candidate of candidates) {
            if (candidate.units < 1) {
                continue;
            }
            if (best === null || CompoundSynthesizer.compareProduct(candidate, best) < 0) {
                best = candidate;
            }
        }
        if (best === null) {
            return null;
        }
        const record = this.buildIonicRecord(best);
        return {
            kind: "ionic",
            catalogId: null,
            record,
            name: best.name,
            formula: best.formula,
            needs: best.needs,
            units: best.units,
        };
    }

    private ionicCandidates(totals: ReadonlyMap<string, number>): IIonicCandidate[] {
        const cations = CompoundSynthesizer.availableCations(totals);
        const anions = CompoundSynthesizer.availableAnions(totals);
        const candidates: IIonicCandidate[] = [];
        for (const cation of cations) {
            for (const anion of anions) {
                const cCharge = Math.abs(cation.charge);
                const aCharge = Math.abs(anion.charge);
                const g = ElementChemistry.gcd(cCharge, aCharge);
                const cationCount = aCharge / g;
                const anionCount = cCharge / g;
                const perUnit = new Map<string, number>();
                for (const [element, count] of cation.composition) {
                    perUnit.set(element, (perUnit.get(element) ?? 0) + count * cationCount);
                }
                for (const [element, count] of anion.composition) {
                    perUnit.set(element, (perUnit.get(element) ?? 0) + count * anionCount);
                }
                let units = Infinity;
                for (const [element, need] of perUnit) {
                    units = Math.min(units, Math.floor((totals.get(element) as number) / need));
                }
                const oxygen = PolyatomicIons.containsOxygen(anion);
                const score = cation.rank + anion.rank - (oxygen ? 1 : 0);
                const name =
                    CompoundSynthesizer.capitalize(cation.label) + " " + anion.label.toLowerCase();
                const formula = groupFormula(cation, cationCount) + groupFormula(anion, anionCount);
                const needs = new Map(perUnit);
                let perUnitAtoms = 0;
                for (const [, need] of perUnit) {
                    perUnitAtoms += need;
                }
                candidates.push({
                    cation,
                    anion,
                    cationCount,
                    anionCount,
                    units,
                    perUnit,
                    needs,
                    atoms: perUnitAtoms * units,
                    chargeProduct: cCharge * aCharge,
                    score,
                    name,
                    formula,
                });
            }
        }
        return candidates;
    }

    private static availableCations(totals: ReadonlyMap<string, number>): IIonSpec[] {
        const list: IIonSpec[] = [];
        for (const [symbol, available] of totals) {
            if (available <= 0 || !ElementChemistry.has(symbol)) {
                continue;
            }
            const info = ElementChemistry.get(symbol);
            if (!ElementChemistry.isMetal(info)) {
                continue;
            }
            for (const charge of info.cations) {
                list.push(CompoundSynthesizer.monatomicCation(symbol, charge));
            }
        }
        for (const ion of PolyatomicIons.cations()) {
            if (CompoundSynthesizer.covers(ion.composition, totals)) {
                list.push(ion);
            }
        }
        return list;
    }

    private static availableAnions(totals: ReadonlyMap<string, number>): IIonSpec[] {
        const list: IIonSpec[] = [];
        for (const [symbol, available] of totals) {
            if (available <= 0 || !ElementChemistry.has(symbol)) {
                continue;
            }
            const info = ElementChemistry.get(symbol);
            if (info.anion === null) {
                continue;
            }
            list.push(CompoundSynthesizer.monatomicAnion(symbol, info.anion));
        }
        for (const ion of PolyatomicIons.anions()) {
            if (CompoundSynthesizer.covers(ion.composition, totals)) {
                list.push(ion);
            }
        }
        return list;
    }

    private static covers(
        composition: ReadonlyMap<string, number>,
        totals: ReadonlyMap<string, number>,
    ): boolean {
        for (const [element, need] of composition) {
            if ((totals.get(element) ?? 0) < need) {
                return false;
            }
        }
        return true;
    }

    private static monatomicCation(symbol: string, charge: number): IIonSpec {
        return {
            id: symbol,
            label: ElementChemistry.cationName(symbol, charge),
            formula: symbol,
            charge,
            composition: new Map([[symbol, 1]]),
            heavy: [symbol],
            bonds: [],
            charges: [[0, charge]],
            explicitH: [],
            bindingAtom: 0,
            rank: 0,
        };
    }

    private static monatomicAnion(symbol: string, charge: number): IIonSpec {
        return {
            id: symbol,
            label: ElementChemistry.anionName(symbol),
            formula: symbol,
            charge: -Math.abs(charge),
            composition: new Map([[symbol, 1]]),
            heavy: [symbol],
            bonds: [],
            charges: [[0, -Math.abs(charge)]],
            explicitH: [],
            bindingAtom: 0,
            rank: symbol === "O" ? 1 : 0,
        };
    }

    private static compareProduct(a: IIonicCandidate, b: IIonicCandidate): number {
        if (a.score !== b.score) {
            return a.score - b.score;
        }
        if (a.atoms !== b.atoms) {
            return b.atoms - a.atoms;
        }
        return a.name.localeCompare(b.name);
    }

    private static compareHint(a: IIonicCandidate, b: IIonicCandidate): number {
        if (a.score !== b.score) {
            return a.score - b.score;
        }
        if (a.chargeProduct !== b.chargeProduct) {
            return a.chargeProduct - b.chargeProduct;
        }
        return a.name.localeCompare(b.name);
    }

    private buildHint(totals: ReadonlyMap<string, number>): string | null {
        const candidates = this.ionicCandidates(totals);
        let best: IIonicCandidate | null = null;
        for (const candidate of candidates) {
            if (best === null || CompoundSynthesizer.compareHint(candidate, best) < 0) {
                best = candidate;
            }
        }
        if (best === null) {
            return null;
        }
        const parts: string[] = [];
        for (const [element, need] of best.perUnit) {
            parts.push(need + " " + element);
        }
        return (
            best.name +
            " needs " +
            parts.join(" and ") +
            " per unit. Add more " +
            CompoundSynthesizer.limitingElement(best.perUnit, totals) +
            "."
        );
    }

    private static limitingElement(
        perUnit: ReadonlyMap<string, number>,
        totals: ReadonlyMap<string, number>,
    ): string {
        let worst = "";
        let ratio = Infinity;
        for (const [element, need] of perUnit) {
            const value = (totals.get(element) as number) / need;
            if (value < ratio) {
                ratio = value;
                worst = element;
            }
        }
        return worst;
    }

    private buildIonicRecord(candidate: IIonicCandidate): IMoleculeRecord {
        const heavy: string[] = [];
        const bonds: Array<readonly [number, number, number]> = [];
        const charges: Array<readonly [number, number]> = [];
        const explicitH: Array<readonly [number, number]> = [];
        const cationStarts: number[] = [];
        for (let i = 0; i < candidate.cationCount; i++) {
            cationStarts.push(heavy.length);
            CompoundSynthesizer.appendIon(candidate.cation, heavy, bonds, charges, explicitH);
        }
        const anionStarts: number[] = [];
        for (let i = 0; i < candidate.anionCount; i++) {
            anionStarts.push(heavy.length);
            CompoundSynthesizer.appendIon(candidate.anion, heavy, bonds, charges, explicitH);
        }
        for (const cationStart of cationStarts) {
            for (const anionStart of anionStarts) {
                bonds.push([
                    cationStart + candidate.cation.bindingAtom,
                    anionStart + candidate.anion.bindingAtom,
                    1,
                ]);
            }
        }
        return this.buildRecord(
            "synth-" + candidate.formula.toLowerCase(),
            candidate.name,
            candidate.formula,
            heavy,
            bonds,
            charges,
            explicitH,
        );
    }

    private static appendIon(
        ion: IIonSpec,
        heavy: string[],
        bonds: Array<readonly [number, number, number]>,
        charges: Array<readonly [number, number]>,
        explicitH: Array<readonly [number, number]>,
    ): void {
        const offset = heavy.length;
        for (const symbol of ion.heavy) {
            heavy.push(symbol);
        }
        for (const bond of ion.bonds) {
            bonds.push([bond[0] + offset, bond[1] + offset, bond[2]]);
        }
        for (const charge of ion.charges) {
            charges.push([charge[0] + offset, charge[1]]);
        }
        for (const hydrogen of ion.explicitH) {
            explicitH.push([hydrogen[0] + offset, hydrogen[1]]);
        }
    }

    private predictCovalent(totals: ReadonlyMap<string, number>): ISynthesisProduct | null {
        const reactive = new Map<string, number>();
        for (const [symbol, count] of totals) {
            if (count > 0 && ElementChemistry.has(symbol)) {
                const info = ElementChemistry.get(symbol);
                if (!ElementChemistry.isInert(info)) {
                    reactive.set(symbol, count);
                }
            }
        }
        if (reactive.size === 0) {
            return null;
        }
        for (const [key, catalogId] of COVALENT_CATALOG) {
            const candidate = CompoundSynthesizer.covalentCandidate(catalogId, null, key, reactive);
            if (candidate !== null) {
                return this.toCovalentProduct(candidate);
            }
        }
        for (const [key, synth] of COVALENT_SYNTH) {
            const candidate = CompoundSynthesizer.covalentCandidate(null, synth, key, reactive);
            if (candidate !== null) {
                return this.toCovalentProduct(candidate);
            }
        }
        return null;
    }

    private static covalentCandidate(
        catalogId: string | null,
        synth: ICovalentSynth | null,
        key: string,
        reactive: ReadonlyMap<string, number>,
    ): {
        catalogId: string | null;
        synth: ICovalentSynth | null;
        formula: string;
        needs: Map<string, number>;
        units: number;
    } | null {
        const needs = keyCounts(key);
        const units = matchMultiplier(needs, reactive);
        if (units === null) {
            return null;
        }
        return {
            catalogId,
            synth,
            formula: synth !== null ? synth.formula : key,
            needs,
            units,
        };
    }

    private toCovalentProduct(candidate: {
        catalogId: string | null;
        synth: ICovalentSynth | null;
        formula: string;
        needs: Map<string, number>;
        units: number;
    }): ISynthesisProduct {
        if (candidate.catalogId !== null) {
            return {
                kind: "covalent",
                catalogId: candidate.catalogId,
                record: null,
                name: "",
                formula: candidate.formula,
                needs: candidate.needs,
                units: candidate.units,
            };
        }
        const synth = candidate.synth as ICovalentSynth;
        const record = this.buildRecord(
            "synth-" + synth.formula.toLowerCase(),
            synth.name,
            synth.formula,
            synth.heavy,
            CompoundSynthesizer.linearBonds(synth.heavy.length, synth.bonds),
            [],
            [],
        );
        return {
            kind: "covalent",
            catalogId: null,
            record,
            name: synth.name,
            formula: synth.formula,
            needs: candidate.needs,
            units: candidate.units,
        };
    }

    private static linearBonds(
        atomCount: number,
        bonds?: ReadonlyArray<readonly [number, number, number]>,
    ): Array<readonly [number, number, number]> {
        if (bonds !== undefined) {
            return bonds.map((bond) => [bond[0], bond[1], bond[2]] as const);
        }
        const result: Array<readonly [number, number, number]> = [];
        for (let i = 1; i < atomCount; i++) {
            result.push([0, i, 1]);
        }
        return result;
    }

    private predictElemental(monatomic: ReadonlyMap<string, number>): ISynthesisProduct | null {
        for (const [symbol, count] of monatomic) {
            const diatomic = DIATOMIC_CATALOG.get(symbol);
            if (diatomic !== undefined && count >= 2) {
                return {
                    kind: "elemental",
                    catalogId: diatomic,
                    record: null,
                    name: ElementChemistry.get(symbol).name,
                    formula: symbol + "2",
                    needs: new Map([[symbol, 2]]),
                    units: Math.floor(count / 2),
                };
            }
            const allotrope = ALLOTROPES.get(symbol);
            if (allotrope !== undefined && count >= allotrope.count) {
                const units = Math.floor(count / allotrope.count);
                if (allotrope.catalogId !== null) {
                    return {
                        kind: "elemental",
                        catalogId: allotrope.catalogId,
                        record: null,
                        name: ElementChemistry.get(symbol).name,
                        formula: symbol + allotrope.count,
                        needs: new Map([[symbol, allotrope.count]]),
                        units,
                    };
                }
                const synth = allotrope.synth as ICovalentSynth;
                return {
                    kind: "elemental",
                    catalogId: null,
                    record: this.buildRecord(
                        "synth-" + synth.formula.toLowerCase(),
                        synth.name,
                        synth.formula,
                        synth.heavy,
                        CompoundSynthesizer.linearBonds(synth.heavy.length, synth.bonds),
                        [],
                        [],
                    ),
                    name: synth.name,
                    formula: synth.formula,
                    needs: new Map([[symbol, allotrope.count]]),
                    units,
                };
            }
        }
        return null;
    }

    private buildRecord(
        id: string,
        name: string,
        formula: string,
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<readonly [number, number, number]>,
        charges: ReadonlyArray<readonly [number, number]>,
        explicitH: ReadonlyArray<readonly [number, number]>,
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
            explicitH,
        };
        const record = this.factory.build(spec);
        this.cache.set(id, record);
        return record;
    }

    private static capitalize(text: string): string {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}
