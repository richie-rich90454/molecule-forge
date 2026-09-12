import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { MoleculeValidator } from "../src/chem/MoleculeValidator";

export class MoleculeBaker {
    public static bake(): string {
        const factory = new MoleculeFactory();
        const registry = new MoleculeRegistry(factory);
        const validator = new MoleculeValidator();
        const lines: string[] = [];
        lines.push("# Molecule Forge Library");
        lines.push("");
        lines.push(
            "Every molecule below is generated from a compact graph record, expanded with implicit",
        );
        lines.push(
            "hydrogens, embedded in 3D with CSD-derived bond tables, relaxed, and validated for",
        );
        lines.push(
            "valence, bond length, formula, and mass. Warning molecules carry a skull badge in the app.",
        );
        lines.push("");
        lines.push("| Name | Formula | Category | Warning | SMILES |");
        lines.push("| --- | --- | --- | --- | --- |");
        let failures = 0;
        for (const record of registry.getAllRecords()) {
            const result = validator.validate(record);
            if (!result.valid) {
                failures++;
            }
            const warn = record.warn ? "yes" : "no";
            lines.push(
                "| " +
                    record.name +
                    " | " +
                    record.formula +
                    " | " +
                    record.category +
                    " | " +
                    warn +
                    " | `" +
                    record.smiles +
                    "` |",
            );
        }
        lines.push("");
        lines.push(
            "Total: " + registry.getCount() + " molecules, " + failures + " validation failures.",
        );
        lines.push("");
        return lines.join("\n");
    }
}

console.log(MoleculeBaker.bake());
