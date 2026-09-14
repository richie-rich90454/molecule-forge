import { ElementChemistry } from "../chem/ElementChemistry";
import { Thermochemistry } from "../chem/Thermochemistry";
import type { IMoleculeRecord, IMoleculeRegistry } from "../chem/MoleculeRecord";
import type { CompoundSynthesizer } from "../chem/CompoundSynthesizer";
import { SpatialHashGrid } from "./SpatialHashGrid";
import type { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { MoleculeInstance } from "./MoleculeInstance";
import type { IReactionSink } from "./ReactionEngine";

interface ISaltInfo {
    readonly metal: string;
    readonly metalCount: number;
    readonly anion: string;
    readonly anionCount: number;
}

export class RedoxEngine {
    private readonly registry: IMoleculeRegistry;
    private readonly synthesizer: CompoundSynthesizer;
    private readonly radius: number;
    private readonly grid: SpatialHashGrid<MoleculeInstance>;
    private readonly nearby: MoleculeInstance[];
    private readonly freeMetals: MoleculeInstance[];
    private readonly saltCache: Map<string, ISaltInfo | null>;

    public constructor(
        registry: IMoleculeRegistry,
        synthesizer: CompoundSynthesizer,
        radius: number = 7,
    ) {
        this.registry = registry;
        this.synthesizer = synthesizer;
        this.radius = radius;
        this.grid = new SpatialHashGrid<MoleculeInstance>(radius);
        this.nearby = [];
        this.freeMetals = [];
        this.saltCache = new Map();
    }

    private static byId(a: MoleculeInstance, b: MoleculeInstance): number {
        return a.id - b.id;
    }

    private saltInfoOf(record: IMoleculeRecord): ISaltInfo | null {
        const cached = this.saltCache.get(record.id);
        if (cached !== undefined) {
            return cached;
        }
        const info = RedoxEngine.saltInfo(record);
        this.saltCache.set(record.id, info);
        return info;
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        const instances = world.getInstanceList();
        this.grid.clear();
        for (const inst of instances) {
            this.grid.insert(inst);
        }
        const freeMetals = this.freeMetals;
        freeMetals.length = 0;
        let hasSalt = false;
        for (const inst of instances) {
            if (inst.record.atoms.length === 1) {
                const element = inst.record.atoms[0].el;
                if (
                    ElementChemistry.isMetal(ElementChemistry.get(element)) &&
                    Thermochemistry.hasCouple(element)
                ) {
                    freeMetals.push(inst);
                }
            } else if (this.saltInfoOf(inst.record) !== null) {
                hasSalt = true;
            }
        }
        if (freeMetals.length === 0 || !hasSalt) {
            return;
        }
        for (const metal of freeMetals) {
            const metalElement = metal.record.atoms[0].el;
            this.grid.queryRadius(metal.px, metal.py, metal.pz, this.radius, this.nearby);
            let eligible = false;
            for (const salt of this.nearby) {
                const info = this.saltInfoOf(salt.record);
                if (info === null || info.metal === metalElement) {
                    continue;
                }
                const cell = Thermochemistry.cellPotential(metalElement, info.metal);
                if (cell !== null && cell > 0) {
                    eligible = true;
                    break;
                }
            }
            if (!eligible) {
                continue;
            }
            this.nearby.sort(RedoxEngine.byId);
            for (const salt of this.nearby) {
                const info = this.saltInfoOf(salt.record);
                if (info === null || info.metal === metalElement) {
                    continue;
                }
                const cell = Thermochemistry.cellPotential(metalElement, info.metal);
                if (cell === null || cell <= 0) {
                    continue;
                }
                if (this.displace(world, metal, salt, info, rng, sink, cell)) {
                    return;
                }
            }
        }
    }

    private displace(
        world: World,
        metal: MoleculeInstance,
        salt: MoleculeInstance,
        info: ISaltInfo,
        rng: SeededRandom,
        sink: IReactionSink,
        cell: number,
    ): boolean {
        const product = this.synthesizer.predict({
            totals: new Map([
                [metal.record.atoms[0].el, 1],
                [info.anion, info.anionCount],
            ]),
            monatomic: new Map(),
        });
        if (product.product === null || product.product.kind !== "ionic") {
            return false;
        }
        const replacement = this.resolve(product.product.catalogId, product.product.record);
        if (replacement === null) {
            return false;
        }
        const displaced = this.registry.findById("el-" + info.metal.toLowerCase());
        if (displaced === undefined) {
            return false;
        }
        const productAtoms = replacement.atoms.length + info.metalCount;
        if (!world.canAccommodate(productAtoms)) {
            return false;
        }
        const cx = (metal.px + salt.px) / 2;
        const cy = (metal.py + salt.py) / 2;
        const cz = (metal.pz + salt.pz) / 2;
        world.remove(metal.id);
        world.remove(salt.id);
        for (let i = 0; i < info.metalCount; i++) {
            world.spawn(
                displaced,
                cx + (rng.next() - 0.5) * 2,
                cy + (rng.next() - 0.5) * 2,
                cz + (rng.next() - 0.5) * 2,
                2,
            );
        }
        world.spawn(replacement, cx, cy, cz, 2);
        sink.publish({
            ruleId: "redox-" + metal.record.atoms[0].el + "-" + info.metal,
            message:
                metal.record.atoms[0].el +
                " displaces " +
                info.metal +
                " (E-cell " +
                cell.toFixed(2) +
                " V).",
            x: cx,
            y: cy,
            z: cz,
            flash: "#ffd479",
            particles: "spark",
        });
        return true;
    }

    private resolve(
        catalogId: string | null,
        record: IMoleculeRecord | null,
    ): IMoleculeRecord | null {
        if (catalogId !== null) {
            return this.registry.findById(catalogId) ?? null;
        }
        return record;
    }

    private static saltInfo(record: IMoleculeRecord): ISaltInfo | null {
        const counts = new Map<string, number>();
        for (const atom of record.atoms) {
            counts.set(atom.el, (counts.get(atom.el) ?? 0) + 1);
        }
        if (counts.size !== 2) {
            return null;
        }
        let metal: string | null = null;
        let anion: string | null = null;
        for (const [element] of counts) {
            const info = ElementChemistry.get(element);
            if (ElementChemistry.isMetal(info)) {
                metal = element;
            } else if (info.anion !== null) {
                anion = element;
            }
        }
        if (metal === null || anion === null) {
            return null;
        }
        return {
            metal,
            metalCount: counts.get(metal) as number,
            anion,
            anionCount: counts.get(anion) as number,
        };
    }
}
