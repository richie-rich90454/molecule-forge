import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";

export class MoleculeValidationRunner {
    public static run(): number {
        const factory = new MoleculeFactory();
        const registry = new MoleculeRegistry(factory);
        const validator = new MoleculeValidator();
        let failures = 0;
        const records = registry.getAllRecords();
        console.log("validating " + records.length + " molecules");
        for (const record of records) {
            const result = validator.validate(record);
            if (!result.valid) {
                failures++;
                console.log("FAIL " + record.id + " (" + record.formula + "):");
                for (const error of result.errors.slice(0, 4)) {
                    console.log("  - " + error);
                }
            }
        }
        const categories = registry.getCategories();
        console.log("categories: " + categories.length + ", molecules: " + records.length);
        for (const category of categories) {
            console.log("  " + category + ": " + registry.getRecords(category).length);
        }
        if (failures === 0) {
            console.log("all molecules validate");
        } else {
            console.log(failures + " molecules failed validation");
        }
        return failures;
    }
}

const failures = MoleculeValidationRunner.run();
process.exit(failures === 0 ? 0 : 1);
