import type { IMoleculeRecord, IMoleculeRegistry } from "../chem/MoleculeRecord";
import { CompoundSynthesizer, type ISynthesisProduct } from "../chem/CompoundSynthesizer";
import { SolventModel } from "../chem/SolventModel";
import type { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { MoleculeInstance } from "./MoleculeInstance";
import type { IReactionSink } from "./ReactionEngine";

const ATOM_PREFIX = "el-";
const FLASH = "#ace1af";

function isElementalSource(record: IMoleculeRecord): boolean {
    const atoms = record.atoms;
    if (atoms.length < 1 || atoms.length > 2) {
        return false;
    }
    const element = atoms[0].el;
    for (const atom of atoms) {
        if (atom.el !== element) {
            return false;
        }
    }
    return true;
}

export class SynthesisEngine {
    private readonly registry: IMoleculeRegistry;
    private readonly synthesizer: CompoundSynthesizer;
    private readonly cell: number;
    private lastHint: string | null;

    public constructor(
        registry: IMoleculeRegistry,
        synthesizer: CompoundSynthesizer,
        radius: number = 7,
    ) {
        this.registry = registry;
        this.synthesizer = synthesizer;
        this.cell = radius;
        this.lastHint = null;
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        const sources = world.getInstanceList().filter((inst) => isElementalSource(inst.record));
        if (sources.length === 0) {
            return;
        }
        const buckets = new Map<string, MoleculeInstance[]>();
        for (const inst of sources) {
            const key =
                Math.floor(inst.px / this.cell) +
                "," +
                Math.floor(inst.py / this.cell) +
                "," +
                Math.floor(inst.pz / this.cell);
            const list = buckets.get(key);
            if (list === undefined) {
                buckets.set(key, [inst]);
            } else {
                list.push(inst);
            }
        }
        const visited = new Set<number>();
        for (const anchor of sources) {
            if (visited.has(anchor.id)) {
                continue;
            }
            visited.add(anchor.id);
            const cluster: MoleculeInstance[] = [anchor];
            const queue: MoleculeInstance[] = [anchor];
            while (queue.length > 0) {
                const current = queue.shift() as MoleculeInstance;
                const cx = Math.floor(current.px / this.cell);
                const cy = Math.floor(current.py / this.cell);
                const cz = Math.floor(current.pz / this.cell);
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const list = buckets.get(cx + dx + "," + (cy + dy) + "," + (cz + dz));
                            if (list === undefined) {
                                continue;
                            }
                            for (const other of list) {
                                if (visited.has(other.id)) {
                                    continue;
                                }
                                const ddx = other.px - current.px;
                                const ddy = other.py - current.py;
                                const ddz = other.pz - current.pz;
                                if (ddx * ddx + ddy * ddy + ddz * ddz > this.cell * this.cell) {
                                    continue;
                                }
                                visited.add(other.id);
                                cluster.push(other);
                                queue.push(other);
                            }
                        }
                    }
                }
            }
            this.processCluster(world, cluster, rng, sink);
        }
    }

    private processCluster(
        world: World,
        cluster: ReadonlyArray<MoleculeInstance>,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        const totals = new Map<string, number>();
        const monatomic = new Map<string, number>();
        for (const inst of cluster) {
            const element = inst.record.atoms[0].el;
            totals.set(element, (totals.get(element) ?? 0) + inst.record.atoms.length);
            if (inst.record.atoms.length === 1) {
                monatomic.set(element, (monatomic.get(element) ?? 0) + 1);
            }
        }
        const prediction = this.synthesizer.predict({ totals, monatomic });
        if (prediction.product !== null) {
            if (!this.conditionsAllow(prediction.product, world)) {
                this.emitHint(prediction.product.name + " needs more heat to form.", cluster, sink);
                return;
            }
            this.execute(world, cluster, prediction.product, rng, sink);
            return;
        }
        if (prediction.hint !== null) {
            this.emitHint(prediction.hint, cluster, sink);
            return;
        }
        this.lastHint = null;
    }

    private conditionsAllow(product: ISynthesisProduct, world: World): boolean {
        const temperature = world.params.temperature;
        if (temperature <= 5) {
            return false;
        }
        if (product.kind === "covalent" && temperature < 250 && world.params.spark <= 0.05) {
            return false;
        }
        if (product.enthalpy === null) {
            return true;
        }
        const charges: number[] = [];
        for (const inst of world.getInstanceList()) {
            for (const atom of inst.record.atoms) {
                if (atom.charge !== 0) {
                    charges.push(atom.charge);
                }
            }
        }
        const activity = SolventModel.activity(
            1,
            charges,
            world.boxSize * world.boxSize * world.boxSize,
        );
        const effective = product.enthalpy / Math.max(0.2, activity);
        return !(effective > 100 && temperature < 800 && world.params.spark <= 0.05);
    }

    private emitHint(
        text: string,
        cluster: ReadonlyArray<MoleculeInstance>,
        sink: IReactionSink,
    ): void {
        if (text === this.lastHint) {
            return;
        }
        this.lastHint = text;
        const center = this.centroid(cluster);
        sink.publish({
            ruleId: "synthesis-hint",
            message: text,
            x: center.x,
            y: center.y,
            z: center.z,
            flash: FLASH,
            particles: "puff",
        });
    }

    private execute(
        world: World,
        cluster: ReadonlyArray<MoleculeInstance>,
        product: ISynthesisProduct,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        const required = new Map<string, number>();
        for (const [symbol, need] of product.needs) {
            required.set(symbol, need * product.units);
        }
        const productSource = this.resolveProduct(product);
        if (productSource === null) {
            return;
        }
        const center = this.centroid(cluster);
        const ordered = [...cluster].sort(
            (a, b) => this.distanceSq(a, center) - this.distanceSq(b, center),
        );
        const consumed = new Map<string, number>();
        const toRemove: MoleculeInstance[] = [];
        for (const inst of ordered) {
            let complete = true;
            for (const [symbol, need] of required) {
                if ((consumed.get(symbol) ?? 0) < need) {
                    complete = false;
                    break;
                }
            }
            if (complete) {
                break;
            }
            const element = inst.record.atoms[0].el;
            const need = required.get(element);
            if (need === undefined || (consumed.get(element) ?? 0) >= need) {
                continue;
            }
            consumed.set(element, (consumed.get(element) ?? 0) + inst.record.atoms.length);
            toRemove.push(inst);
        }
        for (const [symbol, need] of required) {
            if ((consumed.get(symbol) ?? 0) < need) {
                return;
            }
        }
        let leftoverAtoms = 0;
        for (const [symbol, need] of required) {
            leftoverAtoms += (consumed.get(symbol) as number) - need;
        }
        const spawnedAtoms = productSource.record.atoms.length * product.units;
        if (!world.canAccommodate(spawnedAtoms + leftoverAtoms)) {
            return;
        }
        for (const inst of toRemove) {
            world.remove(inst.id);
        }
        for (const [symbol, need] of required) {
            const extra = (consumed.get(symbol) as number) - need;
            if (extra <= 0) {
                continue;
            }
            const atomRecord = this.registry.findById(ATOM_PREFIX + symbol.toLowerCase());
            if (atomRecord === undefined) {
                continue;
            }
            for (let i = 0; i < extra; i++) {
                world.spawn(atomRecord, center.x, center.y, center.z, 2);
            }
        }
        const spacing = product.units > 1 ? 3 : 0;
        for (let i = 0; i < product.units; i++) {
            const gx = spacing * ((i % 3) - 1);
            const gy = spacing * ((Math.floor(i / 3) % 3) - 1);
            const gz = spacing * (Math.floor(i / 9) - 1);
            const jx = (rng.next() - 0.5) * 0.5;
            const jy = (rng.next() - 0.5) * 0.5;
            const jz = (rng.next() - 0.5) * 0.5;
            world.spawn(
                productSource.record,
                center.x + gx + jx,
                center.y + gy + jy,
                center.z + gz + jz,
                2,
            );
        }
        sink.publish({
            ruleId: "synthesis-" + product.formula,
            message:
                product.name +
                " forms as " +
                product.formula +
                (product.enthalpy === null
                    ? "."
                    : " (delta-H " + Math.round(product.enthalpy) + " kJ/mol)."),
            x: center.x,
            y: center.y,
            z: center.z,
            flash: FLASH,
            particles: "link",
        });
    }

    private resolveProduct(product: ISynthesisProduct): { record: IMoleculeRecord } | null {
        if (product.catalogId !== null) {
            const record = this.registry.findById(product.catalogId);
            return record === undefined ? null : { record };
        }
        return product.record === null ? null : { record: product.record };
    }

    private centroid(cluster: ReadonlyArray<MoleculeInstance>): {
        x: number;
        y: number;
        z: number;
    } {
        let x = 0;
        let y = 0;
        let z = 0;
        for (const inst of cluster) {
            x += inst.px;
            y += inst.py;
            z += inst.pz;
        }
        const n = Math.max(1, cluster.length);
        return { x: x / n, y: y / n, z: z / n };
    }

    private distanceSq(inst: MoleculeInstance, point: { x: number; y: number; z: number }): number {
        const dx = inst.px - point.x;
        const dy = inst.py - point.y;
        const dz = inst.pz - point.z;
        return dx * dx + dy * dy + dz * dz;
    }
}
