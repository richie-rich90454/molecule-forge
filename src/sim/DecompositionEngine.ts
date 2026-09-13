import type { IMoleculeRecord } from "../chem/MoleculeRecord";
import { MoleculeCatalog } from "../chem/MoleculeCatalog";
import { MoleculeFactory } from "../chem/MoleculeFactory";
import type { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { MoleculeInstance } from "./MoleculeInstance";
import type { IReactionSink } from "./ReactionEngine";

const CRACK_TEMPERATURE = 1200;
const MIN_HEAVY_ATOMS = 6;
const FLASH = "#ffb060";

export class DecompositionEngine {
    private readonly factory: MoleculeFactory;

    public constructor(factory: MoleculeFactory = new MoleculeFactory()) {
        this.factory = factory;
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        void rng;
        if (world.params.temperature < CRACK_TEMPERATURE) {
            return;
        }
        for (const inst of world.getInstanceList()) {
            if (!DecompositionEngine.isCrackable(inst.record)) {
                continue;
            }
            const split = DecompositionEngine.chooseSplit(inst.record);
            if (split === null) {
                continue;
            }
            this.crack(world, inst, split, sink);
            return;
        }
    }

    private crack(
        world: World,
        inst: MoleculeInstance,
        split: readonly [ReadonlyArray<number>, ReadonlyArray<number>],
        sink: IReactionSink,
    ): void {
        const first = this.buildFragment(inst.record, split[0]);
        const second = this.buildFragment(inst.record, split[1]);
        const center = { x: inst.px, y: inst.py, z: inst.pz };
        world.remove(inst.id);
        world.spawn(first.record, center.x - 1.5, center.y, center.z, 2);
        world.spawn(second.record, center.x + 1.5, center.y, center.z, 2);
        sink.publish({
            ruleId: "cracking-" + inst.record.id,
            message:
                inst.record.name +
                " cracks into " +
                first.record.formula +
                " and " +
                second.record.formula +
                " (pyrolysis).",
            x: center.x,
            y: center.y,
            z: center.z,
            flash: FLASH,
            particles: "smoke",
        });
    }

    private buildFragment(
        record: IMoleculeRecord,
        indices: ReadonlyArray<number>,
    ): { record: IMoleculeRecord } {
        const remap = new Map<number, number>();
        const heavy: string[] = [];
        for (const index of indices) {
            remap.set(index, heavy.length);
            heavy.push(record.atoms[index].el);
        }
        const bonds: Array<readonly [number, number, number]> = [];
        for (const bond of record.bonds) {
            const a = remap.get(bond.a);
            const b = remap.get(bond.b);
            if (a !== undefined && b !== undefined) {
                bonds.push([a, b, bond.order]);
            }
        }
        const charges: Array<readonly [number, number]> = [];
        for (const index of indices) {
            const charge = record.atoms[index].charge;
            if (charge !== 0) {
                charges.push([remap.get(index) as number, charge]);
            }
        }
        const explicitH: Array<readonly [number, number]> = [];
        for (const index of indices) {
            const local = remap.get(index) as number;
            if (heavy[local] !== "H") {
                explicitH.push([local, 0]);
            }
        }
        const formula = MoleculeCatalog.formulaOf(heavy, bonds, charges, explicitH);
        return {
            record: this.factory.build({
                id: "crack-" + record.id + "-" + formula,
                name: "Fragment " + formula,
                formula,
                smiles: "",
                category: "functional",
                tags: ["compound", "cracked"],
                warn: false,
                inchi: "",
                heavy,
                bonds,
                charges,
                explicitH,
            }),
        };
    }

    private static isCrackable(record: IMoleculeRecord): boolean {
        let heavy = 0;
        let carbon = 0;
        for (const atom of record.atoms) {
            if (atom.el !== "H") {
                heavy++;
                if (atom.el === "C") {
                    carbon++;
                }
            }
        }
        return carbon > 0 && heavy >= MIN_HEAVY_ATOMS;
    }

    private static chooseSplit(
        record: IMoleculeRecord,
    ): readonly [ReadonlyArray<number>, ReadonlyArray<number>] | null {
        const total = record.atoms.length;
        let best: readonly [ReadonlyArray<number>, ReadonlyArray<number>] | null = null;
        let bestBalance = Infinity;
        for (let bondIndex = 0; bondIndex < record.bonds.length; bondIndex++) {
            const bond = record.bonds[bondIndex];
            if (record.atoms[bond.a].el === "H" || record.atoms[bond.b].el === "H") {
                continue;
            }
            const group = DecompositionEngine.component(record, bondIndex, bond.a);
            if (group.length === total) {
                continue;
            }
            const inGroup = new Set(group);
            const rest: number[] = [];
            for (let i = 0; i < total; i++) {
                if (!inGroup.has(i)) {
                    rest.push(i);
                }
            }
            const balance = Math.abs(group.length - rest.length);
            if (balance < bestBalance) {
                bestBalance = balance;
                best = [group, rest];
            }
        }
        return best;
    }

    private static component(
        record: IMoleculeRecord,
        excludedBond: number,
        start: number,
    ): number[] {
        const adjacency = DecompositionEngine.adjacency(record);
        const seen = new Set<number>([start]);
        const queue: number[] = [start];
        while (queue.length > 0) {
            const current = queue.shift() as number;
            for (const edge of adjacency[current]) {
                if (edge.bond === excludedBond || seen.has(edge.to)) {
                    continue;
                }
                seen.add(edge.to);
                queue.push(edge.to);
            }
        }
        return Array.from(seen);
    }

    private static adjacency(record: IMoleculeRecord): Array<Array<{ to: number; bond: number }>> {
        const adjacency: Array<Array<{ to: number; bond: number }>> = [];
        for (let i = 0; i < record.atoms.length; i++) {
            adjacency.push([]);
        }
        for (let i = 0; i < record.bonds.length; i++) {
            const bond = record.bonds[i];
            adjacency[bond.a].push({ to: bond.b, bond: i });
            adjacency[bond.b].push({ to: bond.a, bond: i });
        }
        return adjacency;
    }
}
