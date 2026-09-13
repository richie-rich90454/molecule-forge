import { ElementRegistry } from "./ElementRegistry";
import type { IMoleculeRecord } from "./MoleculeRecord";

export interface IValidationResult {
    readonly valid: boolean;
    readonly errors: ReadonlyArray<string>;
}

export class MoleculeValidator {
    private readonly minAtomDistance: number;
    private readonly maxBondLength: number;
    private readonly maxMetalBondLength: number;
    private readonly massTolerance: number;

    public constructor() {
        this.minAtomDistance = 0.5;
        this.maxBondLength = 2.3;
        this.maxMetalBondLength = 2.4;
        this.massTolerance = 0.6;
    }

    public validate(record: IMoleculeRecord): IValidationResult {
        const errors: string[] = [];
        this.checkElements(record, errors);
        this.checkBondIndices(record, errors);
        this.checkValences(record, errors);
        this.checkDistances(record, errors);
        this.checkBondLengths(record, errors);
        this.checkFormula(record, errors);
        this.checkMass(record, errors);
        return { valid: errors.length === 0, errors };
    }

    private checkElements(record: IMoleculeRecord, errors: string[]): void {
        for (const atom of record.atoms) {
            if (!ElementRegistry.has(atom.el)) {
                errors.push("unknown element " + atom.el);
            }
        }
    }

    private checkBondIndices(record: IMoleculeRecord, errors: string[]): void {
        for (const bond of record.bonds) {
            if (
                bond.a < 0 ||
                bond.b < 0 ||
                bond.a >= record.atoms.length ||
                bond.b >= record.atoms.length
            ) {
                errors.push("bond index out of range " + bond.a + "-" + bond.b);
            }
            if (bond.a === bond.b) {
                errors.push("self bond on atom " + bond.a);
            }
        }
    }

    private checkValences(record: IMoleculeRecord, errors: string[]): void {
        const sums = new Array<number>(record.atoms.length).fill(0);
        for (const bond of record.bonds) {
            const w = bond.order === 2 ? 2 : bond.order === 3 ? 3 : 1;
            sums[bond.a] += w;
            sums[bond.b] += w;
        }
        for (let i = 0; i < record.atoms.length; i++) {
            const atom = record.atoms[i];
            if (!ElementRegistry.has(atom.el)) {
                continue;
            }
            const base = ElementRegistry.get(atom.el).maxValence;
            const max = base + (atom.charge !== 0 ? 1 : 0) + (base > 4 ? 2 : 0);
            if (sums[i] > max + 1e-9) {
                errors.push("valence exceeded on " + atom.el + i + ": " + sums[i] + " > " + max);
            }
        }
    }

    private checkDistances(record: IMoleculeRecord, errors: string[]): void {
        const atoms = record.atoms;
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const dx = atoms[i].x - atoms[j].x;
                const dy = atoms[i].y - atoms[j].y;
                const dz = atoms[i].z - atoms[j].z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < this.minAtomDistance) {
                    errors.push(
                        "atoms too close: " + i + "-" + j + " at " + dist.toFixed(3) + " A",
                    );
                    return;
                }
            }
        }
    }

    private checkBondLengths(record: IMoleculeRecord, errors: string[]): void {
        const metals = new Set(["Fe", "Pt", "Na", "K", "Ca", "Mg", "Zn", "Cu"]);
        for (const bond of record.bonds) {
            const a = record.atoms[bond.a];
            const b = record.atoms[bond.b];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dz = a.z - b.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const base =
                metals.has(a.el) || metals.has(b.el) ? this.maxMetalBondLength : this.maxBondLength;
            const order = bond.aromatic ? 4 : bond.order;
            const ideal = ElementRegistry.bondLength(a.el, b.el, order);
            const limit = Math.max(base, ideal * 1.15);
            if (dist > limit) {
                errors.push(
                    "bond too long: " + bond.a + "-" + bond.b + " at " + dist.toFixed(3) + " A",
                );
                return;
            }
        }
    }

    private checkFormula(record: IMoleculeRecord, errors: string[]): void {
        const counts = new Map<string, number>();
        for (const atom of record.atoms) {
            counts.set(atom.el, (counts.get(atom.el) ?? 0) + 1);
        }
        const expected = MoleculeValidator.parseFormula(record.formula);
        const keys = new Set([...counts.keys(), ...expected.keys()]);
        for (const key of keys) {
            const got = counts.get(key) ?? 0;
            const want = expected.get(key) ?? 0;
            if (got !== want) {
                errors.push(
                    "formula mismatch for " + key + ": graph has " + got + ", formula says " + want,
                );
            }
        }
    }

    private checkMass(record: IMoleculeRecord, errors: string[]): void {
        let mass = 0;
        for (const atom of record.atoms) {
            if (!ElementRegistry.has(atom.el)) {
                continue;
            }
            mass += ElementRegistry.get(atom.el).mass;
        }
        if (Math.abs(mass - record.mass) > this.massTolerance) {
            errors.push(
                "mass mismatch: computed " + mass.toFixed(2) + ", stored " + record.mass.toFixed(2),
            );
        }
    }

    public static parseFormula(formula: string): Map<string, number> {
        const counts = new Map<string, number>();
        const pattern = /([A-Z][a-z]?)(\d*)/g;
        let match = pattern.exec(formula);
        while (match !== null) {
            const el = match[1];
            const n = match[2] === "" ? 1 : parseInt(match[2], 10);
            counts.set(el, (counts.get(el) ?? 0) + n);
            match = pattern.exec(formula);
        }
        return counts;
    }
}
