import { beforeAll, describe, expect, it } from "vitest";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";
import { SmilesParser } from "../src/chem/SmilesParser";

let registry: MoleculeRegistry;

beforeAll(() => {
    registry = new MoleculeRegistry(new MoleculeFactory());
}, 120000);

describe("MoleculeLibrary", () => {
    it("holds at least three hundred molecules", () => {
        expect(registry.getCount()).toBeGreaterThanOrEqual(300);
    });

    it("covers all sixteen categories", () => {
        expect(registry.getCategories().length).toBe(16);
    });

    it("validates every molecule record", () => {
        const validator = new MoleculeValidator();
        const failures: string[] = [];
        for (const record of registry.getAllRecords()) {
            const result = validator.validate(record);
            if (!result.valid) {
                failures.push(record.id + ": " + result.errors.join("; "));
            }
        }
        expect(failures).toEqual([]);
    });

    it("parses benzene SMILES to the right formula", () => {
        const parsed = new SmilesParser().parse("c1ccccc1");
        expect(parsed.heavy.length).toBe(6);
        expect(parsed.bonds.length).toBe(6);
    });

    it("finds caffeine by id", () => {
        const caffeine = registry.findById("caffeine");
        expect(caffeine).toBeDefined();
        expect(caffeine?.formula).toBe("C8H10N4O2");
    });
});
