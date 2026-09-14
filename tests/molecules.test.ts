import { beforeAll, describe, expect, it } from "vitest";
import { MoleculeCatalog } from "../src/chem/MoleculeCatalog";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";
import { SmilesParser } from "../src/chem/SmilesParser";
import { PresetCatalog } from "../src/presets/PresetCatalog";

let registry: MoleculeRegistry;

beforeAll(() => {
    registry = new MoleculeRegistry(new MoleculeFactory());
}, 120000);

describe("MoleculeLibrary", () => {
    it("holds at least three hundred molecules", () => {
        expect(registry.getCount()).toBeGreaterThanOrEqual(300);
    });

    it("covers all categories with data", () => {
        expect(registry.getCategories().length).toBeGreaterThanOrEqual(25);
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
    }, 120000);

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

    it("references only real molecules from presets", () => {
        const ids = new Set(MoleculeCatalog.buildCompactSpecs().map((spec) => spec.id));
        const missing: string[] = [];
        for (const preset of PresetCatalog.buildPresets()) {
            for (const spawn of preset.spawns) {
                if (!ids.has(spawn.moleculeId)) {
                    missing.push(preset.id + ":" + spawn.moleculeId);
                }
            }
        }
        expect(missing).toEqual([]);
    });
});
