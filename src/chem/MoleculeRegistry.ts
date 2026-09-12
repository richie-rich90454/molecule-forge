import { MoleculeCatalog } from "./MoleculeCatalog";
import { MoleculeFactory } from "./MoleculeFactory";
import type { IMoleculeRecord, IMoleculeRegistry, MoleculeCategory } from "./MoleculeRecord";

export class MoleculeRegistry implements IMoleculeRegistry {
    private readonly records: IMoleculeRecord[];
    private readonly byId: Map<string, IMoleculeRecord>;
    private readonly byCategory: Map<MoleculeCategory, IMoleculeRecord[]>;

    public constructor(factory: MoleculeFactory) {
        this.records = [];
        this.byId = new Map();
        this.byCategory = new Map();
        const specs = MoleculeCatalog.buildCompactSpecs();
        for (const spec of specs) {
            const record = factory.build(spec);
            this.records.push(record);
            this.byId.set(record.id, record);
            const list = this.byCategory.get(record.category);
            if (list === undefined) {
                this.byCategory.set(record.category, [record]);
            } else {
                list.push(record);
            }
        }
    }

    public getCategories(): ReadonlyArray<MoleculeCategory> {
        return Array.from(this.byCategory.keys());
    }

    public getRecords(category: MoleculeCategory): ReadonlyArray<IMoleculeRecord> {
        return this.byCategory.get(category) ?? [];
    }

    public getAllRecords(): ReadonlyArray<IMoleculeRecord> {
        return this.records;
    }

    public findById(id: string): IMoleculeRecord | undefined {
        return this.byId.get(id);
    }

    public getCount(): number {
        return this.records.length;
    }

    public getTagCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const record of this.records) {
            for (const tag of record.tags) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }
        return counts;
    }
}
