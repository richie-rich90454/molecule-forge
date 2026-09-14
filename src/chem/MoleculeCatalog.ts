import { ElementRegistry } from "./ElementRegistry";
import { SmilesParser } from "./SmilesParser";
import type { CompactBond, ICompactMoleculeSpec, IMoleculeSpecJson } from "./MoleculeRecord";

import alkanes from "./data/alkanes.json";
import alkenes from "./data/alkenes.json";
import alkynes from "./data/alkynes.json";
import amino from "./data/amino.json";
import aromatics from "./data/aromatics.json";
import biomolecules from "./data/biomolecules.json";
import elemental from "./data/elemental.json";
import exotic from "./data/exotic.json";
import explosives from "./data/explosives.json";
import functional from "./data/functional.json";
import halocarbons from "./data/halocarbons.json";
import lipids from "./data/lipids.json";
import natural from "./data/natural.json";
import neuro from "./data/neuro.json";
import nucleotides from "./data/nucleotides.json";
import pharma from "./data/pharma.json";
import polymers from "./data/polymers.json";
import sugars from "./data/sugars.json";
import toxins from "./data/toxins.json";
import acidsBases from "./data/acids-bases.json";
import salts from "./data/salts.json";
import oxidesMinerals from "./data/oxides-minerals.json";
import coordination from "./data/coordination.json";
import catalysts from "./data/catalysts.json";
import dyesPigments from "./data/dyes-pigments.json";
import pesticides from "./data/pesticides.json";
import solvents from "./data/solvents.json";
import vitaminsHormones from "./data/vitamins-hormones.json";

const FILES: ReadonlyArray<ReadonlyArray<IMoleculeSpecJson>> = [
    alkanes,
    alkenes,
    alkynes,
    aromatics,
    functional,
    halocarbons,
    amino,
    sugars,
    nucleotides,
    lipids,
    pharma,
    neuro,
    polymers,
    explosives,
    toxins,
    pesticides,
    dyesPigments,
    solvents,
    vitaminsHormones,
    acidsBases,
    salts,
    oxidesMinerals,
    coordination,
    catalysts,
    exotic,
    biomolecules,
    natural,
    elemental,
].map((entries) => entries as unknown as IMoleculeSpecJson[]);

export class MoleculeCatalog {
    private static cache: ICompactMoleculeSpec[] | null = null;

    public static buildCompactSpecs(): ICompactMoleculeSpec[] {
        if (MoleculeCatalog.cache !== null) {
            return MoleculeCatalog.cache;
        }
        const specs: ICompactMoleculeSpec[] = [];
        for (const entries of FILES) {
            for (const entry of entries) {
                specs.push(MoleculeCatalog.toSpec(entry));
            }
        }
        MoleculeCatalog.cache = specs;
        return specs;
    }

    private static toSpec(entry: IMoleculeSpecJson): ICompactMoleculeSpec {
        let heavy = entry.heavy;
        let bonds = entry.bonds;
        let charges = entry.charges;
        let explicitH = entry.explicitH;
        if (heavy === undefined || bonds === undefined) {
            const parsed = new SmilesParser().parse(entry.smiles);
            heavy = parsed.heavy;
            bonds = parsed.bonds;
            charges = charges ?? parsed.charges;
            explicitH = explicitH ?? parsed.explicitH;
        }
        return {
            id: entry.id,
            name: entry.name,
            formula: entry.formula,
            smiles: entry.smiles,
            category: entry.category,
            tags: entry.tags,
            warn: entry.warn,
            inchi: entry.inchi,
            priority: entry.priority,
            heavy,
            bonds,
            charges: charges ?? [],
            explicitH: explicitH ?? [],
            ionicBonds: entry.ionicBonds,
        };
    }

    public static formulaOf(
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<CompactBond>,
        charges: ReadonlyArray<readonly [number, number]> = [],
        explicitH: ReadonlyArray<readonly [number, number]> = [],
    ): string {
        const chargeMap = new Map<number, number>();
        for (const c of charges) {
            chargeMap.set(c[0], c[1]);
        }
        const explicitMap = new Map<number, number>();
        for (const h of explicitH) {
            explicitMap.set(h[0], h[1]);
        }
        const orderSum = new Array<number>(heavy.length).fill(0);
        for (const b of bonds) {
            const w = b[2] === 2 ? 2 : b[2] === 3 ? 3 : b[2] === 4 ? 1.5 : 1;
            orderSum[b[0]] += w;
            orderSum[b[1]] += w;
        }
        const counts = new Map<string, number>();
        for (let i = 0; i < heavy.length; i++) {
            const el = heavy[i];
            counts.set(el, (counts.get(el) ?? 0) + 1);
            let h: number;
            if (explicitMap.has(i)) {
                h = explicitMap.get(i) as number;
            } else {
                h = ElementRegistry.implicitHydrogens(el, orderSum[i], chargeMap.get(i) ?? 0);
                h = Math.max(0, Math.round(h));
            }
            counts.set("H", (counts.get("H") ?? 0) + h);
        }
        const order = [
            "C",
            "H",
            "Ac",
            "Ag",
            "Al",
            "Ar",
            "As",
            "At",
            "Au",
            "B",
            "Ba",
            "Be",
            "Bi",
            "Br",
            "Ca",
            "Cd",
            "Ce",
            "Cl",
            "Co",
            "Cr",
            "Cs",
            "Cu",
            "Dy",
            "Er",
            "Eu",
            "F",
            "Fe",
            "Fr",
            "Ga",
            "Gd",
            "Ge",
            "He",
            "Hf",
            "Hg",
            "Ho",
            "I",
            "In",
            "Ir",
            "K",
            "Kr",
            "La",
            "Li",
            "Lu",
            "Mg",
            "Mn",
            "Mo",
            "N",
            "Na",
            "Nb",
            "Nd",
            "Ne",
            "Ni",
            "Np",
            "O",
            "Os",
            "P",
            "Pa",
            "Pb",
            "Pd",
            "Pm",
            "Po",
            "Pr",
            "Pt",
            "Pu",
            "Ra",
            "Rb",
            "Re",
            "Rh",
            "Rn",
            "Ru",
            "S",
            "Sb",
            "Sc",
            "Se",
            "Si",
            "Sm",
            "Sn",
            "Sr",
            "Ta",
            "Tb",
            "Tc",
            "Te",
            "Th",
            "Ti",
            "Tl",
            "Tm",
            "U",
            "V",
            "W",
            "Xe",
            "Y",
            "Yb",
            "Zn",
            "Zr",
        ];
        let formula = "";
        for (const el of order) {
            const n = counts.get(el) ?? 0;
            if (n > 0) {
                formula += el + (n > 1 ? String(n) : "");
            }
            counts.delete(el);
        }
        for (const [el, n] of counts) {
            formula += el + (n > 1 ? String(n) : "");
        }
        return formula;
    }
}
