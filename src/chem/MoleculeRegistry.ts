import { MoleculeCatalog } from "./MoleculeCatalog";
import { MoleculeFactory } from "./MoleculeFactory";
import type {
    ICompactMoleculeSpec,
    IMoleculeRecord,
    IMoleculeRegistry,
    MoleculeCategory,
} from "./MoleculeRecord";

export class MoleculeRegistry implements IMoleculeRegistry {
    private readonly factory: MoleculeFactory;
    private readonly specs: ReadonlyArray<ICompactMoleculeSpec>;
    private readonly specsById: Map<string, ICompactMoleculeSpec>;
    private readonly specsByCategory: Map<MoleculeCategory, ICompactMoleculeSpec[]>;
    private readonly cache: Map<string, IMoleculeRecord>;

    public constructor(factory: MoleculeFactory) {
        this.factory = factory;
        this.specs = MoleculeCatalog.buildCompactSpecs();
        this.specsById = new Map();
        this.specsByCategory = new Map();
        this.cache = new Map();
        for (const spec of this.specs) {
            this.specsById.set(spec.id, spec);
            const list = this.specsByCategory.get(spec.category);
            if (list === undefined) {
                this.specsByCategory.set(spec.category, [spec]);
            } else {
                list.push(spec);
            }
        }
    }

    private build(spec: ICompactMoleculeSpec): IMoleculeRecord {
        const cached = this.cache.get(spec.id);
        if (cached !== undefined) {
            return cached;
        }
        const record = this.factory.build(spec);
        this.cache.set(spec.id, record);
        return record;
    }

    public getCategories(): ReadonlyArray<MoleculeCategory> {
        return Array.from(this.specsByCategory.keys());
    }

    public getRecords(category: MoleculeCategory): ReadonlyArray<IMoleculeRecord> {
        const specs = this.specsByCategory.get(category);
        if (specs === undefined) {
            return [];
        }
        return specs.map((spec) => this.build(spec));
    }

    public getAllRecords(): ReadonlyArray<IMoleculeRecord> {
        return this.specs.map((spec) => this.build(spec));
    }

    public getCategoryIds(category: MoleculeCategory): ReadonlyArray<string> {
        const specs = this.specsByCategory.get(category);
        return specs === undefined ? [] : specs.map((spec) => spec.id);
    }

    public getBuiltRecord(id: string): IMoleculeRecord | undefined {
        return this.cache.get(id);
    }

    public findById(id: string): IMoleculeRecord | undefined {
        const spec = this.specsById.get(id);
        return spec === undefined ? undefined : this.build(spec);
    }

    public getCount(): number {
        return this.specs.length;
    }

    public getTagCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const spec of this.specs) {
            for (const tag of spec.tags) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }
        return counts;
    }
}
