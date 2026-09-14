import { ElementRegistry } from "./ElementRegistry";
import type { IMoleculeRecord } from "./MoleculeRecord";

export interface IValidationResult {
    readonly valid: boolean;
    readonly errors: ReadonlyArray<string>;
}

export class MoleculeValidator {
    private static readonly HYPERVALENT: ReadonlyMap<string, number> = new Map([
        ["Cl", 7],
        ["Br", 7],
        ["I", 7],
        ["S", 6],
        ["Se", 6],
        ["Te", 6],
        ["P", 5],
        ["N", 5],
        ["As", 5],
        ["Si", 6],
        ["B", 4],
        ["Xe", 6],
    ]);

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
        this.checkAromaticity(record, errors);
        this.checkChargeConsistency(record, errors);
        return { valid: errors.length === 0, errors };
    }

    private checkAromaticity(record: IMoleculeRecord, errors: string[]): void {
        const aromaticBondAtoms = new Set<number>();
        for (const bond of record.bonds) {
            if (bond.aromatic) {
                aromaticBondAtoms.add(bond.a);
                aromaticBondAtoms.add(bond.b);
            }
        }
        for (let i = 0; i < record.atoms.length; i++) {
            if (record.atoms[i].aromatic && !aromaticBondAtoms.has(i)) {
                errors.push("aromatic atom " + i + " carries no aromatic bond");
                return;
            }
        }
        for (const bond of record.bonds) {
            if (!bond.aromatic) {
                continue;
            }
            const a = record.atoms[bond.a];
            const b = record.atoms[bond.b];
            if (a !== undefined && b !== undefined && (!a.aromatic || !b.aromatic)) {
                errors.push(
                    "aromatic bond " + bond.a + "-" + bond.b + " touches a non-aromatic atom",
                );
                return;
            }
        }
    }

    private checkChargeConsistency(record: IMoleculeRecord, errors: string[]): void {
        for (const bond of record.bonds) {
            if (bond.ionic !== true) {
                continue;
            }
            const a = record.atoms[bond.a];
            const b = record.atoms[bond.b];
            if (a === undefined || b === undefined) {
                continue;
            }
            if (a.charge === 0 || b.charge === 0 || a.charge > 0 === b.charge > 0) {
                errors.push(
                    "ionic bond " +
                        bond.a +
                        "-" +
                        bond.b +
                        " lacks opposite formal charges (" +
                        a.charge +
                        ", " +
                        b.charge +
                        ")",
                );
                return;
            }
        }
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
            if (bond.a < 0 || bond.b < 0 || bond.a >= sums.length || bond.b >= sums.length) {
                continue;
            }
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
            const hypervalent = MoleculeValidator.HYPERVALENT.get(atom.el) ?? 0;
            const max = Math.max(
                base + (atom.charge !== 0 ? 1 : 0) + (base > 4 ? 2 : 0),
                hypervalent,
            );
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
            if (a === undefined || b === undefined) {
                continue;
            }
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
        let index = 0;
        const isSeparator = (ch: string): boolean =>
            ch === "\u00b7" || ch === "\u2022" || ch === "\u22c5" || ch === "*";
        const add = (
            target: Map<string, number>,
            source: Map<string, number>,
            scale: number,
        ): void => {
            for (const [element, count] of source) {
                target.set(element, (target.get(element) ?? 0) + count * scale);
            }
        };
        const readNumber = (): number => {
            let digits = "";
            while (index < formula.length && formula[index] >= "0" && formula[index] <= "9") {
                digits += formula[index];
                index++;
            }
            return digits === "" ? 1 : parseInt(digits, 10);
        };
        const readElement = (): string | null => {
            const ch = formula[index];
            if (ch < "A" || ch > "Z") {
                return null;
            }
            let element = ch;
            index++;
            if (index < formula.length && formula[index] >= "a" && formula[index] <= "z") {
                element += formula[index];
                index++;
            }
            return element;
        };
        const parseSequence = (stopAtClose: boolean): Map<string, number> => {
            const local = new Map<string, number>();
            while (index < formula.length) {
                const ch = formula[index];
                if (isSeparator(ch)) {
                    return local;
                }
                if (ch === "(" || ch === "[") {
                    index++;
                    add(local, parseSequence(true), readNumber());
                } else if (ch === ")" || ch === "]") {
                    index++;
                    if (stopAtClose) {
                        return local;
                    }
                } else {
                    const element = readElement();
                    if (element === null) {
                        index++;
                    } else {
                        local.set(element, (local.get(element) ?? 0) + readNumber());
                    }
                }
            }
            return local;
        };
        const result = new Map<string, number>();
        while (index < formula.length) {
            if (isSeparator(formula[index])) {
                index++;
                continue;
            }
            let digits = "";
            while (index < formula.length && formula[index] >= "0" && formula[index] <= "9") {
                digits += formula[index];
                index++;
            }
            const scale = digits === "" ? 1 : parseInt(digits, 10);
            add(result, parseSequence(false), scale);
        }
        return result;
    }
}
