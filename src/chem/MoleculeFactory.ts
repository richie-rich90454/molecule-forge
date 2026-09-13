import { ElementRegistry } from "../chem/ElementRegistry";
import type {
    BondOrder,
    IAtomSpec,
    IBondSpec,
    ICompactMoleculeSpec,
    IMoleculeProperties,
    IMoleculeProvenance,
    IMoleculeRecord,
} from "../chem/MoleculeRecord";

interface IPlacedAtom {
    el: string;
    x: number;
    y: number;
    z: number;
}

export class MoleculeFactory {
    private readonly provenance: IMoleculeProvenance = {
        source: "MoleculeForge procedural embedding (CSD-derived bond tables)",
        generatorVersion: "1.0.0",
        smilesCanonical: "",
    };

    public constructor() {}

    public build(spec: ICompactMoleculeSpec): IMoleculeRecord {
        const bonds = MoleculeFactory.dedupeBonds(spec.bonds);
        const orderSums = MoleculeFactory.computeOrderSums(spec.heavy.length, bonds);
        const charges = new Map<number, number>(spec.charges);
        const explicitH = new Map<number, number>(spec.explicitH);
        const hCounts = MoleculeFactory.computeHydrogens(spec.heavy, orderSums, charges, explicitH);
        const placed = MoleculeFactory.embedHeavy(spec, bonds);
        const withH = MoleculeFactory.addHydrogens(spec, bonds, placed, hCounts);
        const elements = [...spec.heavy];
        for (let i = spec.heavy.length; i < withH.atoms.length; i++) {
            elements.push("H");
        }
        const rng = MoleculeFactory.mulberry(MoleculeFactory.hashSeed(spec.id + ":relax"));
        MoleculeFactory.relax(withH.atoms, elements, withH.bonds, rng);
        const allAtoms = withH.atoms;
        const mass = MoleculeFactory.computeMass(allAtoms);
        const properties = MoleculeFactory.estimateProperties(spec, bonds, hCounts);
        const atomSpecs = MoleculeFactory.toAtomSpecs(spec, bonds, allAtoms, charges);
        const bondSpecs = MoleculeFactory.toBondSpecs(bonds);
        return {
            id: spec.id,
            name: spec.name,
            formula: spec.formula,
            smiles: spec.smiles,
            inchi: spec.inchi,
            category: spec.category,
            tags: spec.tags,
            warn: spec.warn,
            mass,
            atoms: atomSpecs,
            bonds: bondSpecs,
            properties,
            provenance: { ...this.provenance, smilesCanonical: spec.smiles },
        };
    }

    public static dedupeBonds(
        bonds: ReadonlyArray<readonly [number, number, number, string?]>,
    ): Array<{ a: number; b: number; order: number; stereo: string | null }> {
        const seen = new Map<
            string,
            { a: number; b: number; order: number; stereo: string | null }
        >();
        for (const b of bonds) {
            const a = Math.min(b[0], b[1]);
            const c = Math.max(b[0], b[1]);
            const key = a + ":" + c;
            const entry = { a, b: c, order: b[2], stereo: (b[3] as string | undefined) ?? null };
            const prev = seen.get(key);
            if (prev === undefined || entry.order > prev.order) {
                seen.set(key, entry);
            } else if (entry.order === prev.order && prev.stereo === null) {
                prev.stereo = entry.stereo;
            }
        }
        return Array.from(seen.values());
    }

    private static computeOrderSums(
        count: number,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
    ): number[] {
        const sums = new Array<number>(count).fill(0);
        for (const b of bonds) {
            const w = b.order === 2 ? 2 : b.order === 3 ? 3 : b.order === 4 ? 1.5 : 1;
            sums[b.a] += w;
            sums[b.b] += w;
        }
        return sums;
    }

    private static computeHydrogens(
        heavy: ReadonlyArray<string>,
        orderSums: ReadonlyArray<number>,
        charges: ReadonlyMap<number, number>,
        explicitH: ReadonlyMap<number, number>,
    ): number[] {
        const counts: number[] = [];
        for (let i = 0; i < heavy.length; i++) {
            const explicit = explicitH.get(i);
            if (explicit !== undefined) {
                counts.push(explicit);
                continue;
            }
            const h = ElementRegistry.implicitHydrogens(
                heavy[i],
                orderSums[i],
                charges.get(i) ?? 0,
            );
            counts.push(Math.max(0, Math.round(h)));
        }
        return counts;
    }

    private static hashSeed(text: string): number {
        let h = 2166136261;
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    private static mulberry(seed: number): () => number {
        let s = seed;
        return () => {
            s |= 0;
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    private static tetraDirections(): number[][] {
        const s = 1 / Math.sqrt(3);
        return [
            [s, s, s],
            [s, -s, -s],
            [-s, s, -s],
            [-s, -s, s],
        ];
    }

    private static trigonalDirections(): number[][] {
        const dirs: number[][] = [];
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            dirs.push([Math.cos(a), Math.sin(a), 0]);
        }
        return dirs;
    }

    private static bipyramidalDirections(): number[][] {
        const dirs = MoleculeFactory.trigonalDirections();
        dirs.push([0, 0, 1]);
        dirs.push([0, 0, -1]);
        return dirs;
    }

    private static octahedralDirections(): number[][] {
        return [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
        ];
    }

    private static rotate(dirs: number[][], rng: () => number): number[][] {
        const ax = rng() * Math.PI * 2;
        const ay = rng() * Math.PI * 2;
        const cx = Math.cos(ax);
        const sx = Math.sin(ax);
        const cy = Math.cos(ay);
        const sy = Math.sin(ay);
        return dirs.map((d) => {
            const y1 = d[1] * cx - d[2] * sx;
            const z1 = d[1] * sx + d[2] * cx;
            const x2 = d[0] * cy + z1 * sy;
            const z2 = -d[0] * sy + z1 * cy;
            return [x2, y1, z2];
        });
    }

    private static neighborDirections(count: number, rng: () => number): number[][] {
        if (count <= 1) {
            return MoleculeFactory.rotate(
                [
                    [1, 0, 0],
                    [-1, 0, 0],
                ],
                rng,
            );
        }
        if (count === 2) {
            return MoleculeFactory.rotate(
                [
                    [1, 0, 0],
                    [-0.5, 0.866, 0],
                    [-0.5, -0.866, 0],
                ],
                rng,
            );
        }
        if (count === 3) {
            return MoleculeFactory.rotate(MoleculeFactory.trigonalDirections(), rng);
        }
        if (count === 5) {
            return MoleculeFactory.rotate(MoleculeFactory.bipyramidalDirections(), rng);
        }
        if (count >= 6) {
            return MoleculeFactory.rotate(MoleculeFactory.octahedralDirections(), rng);
        }
        return MoleculeFactory.rotate(MoleculeFactory.tetraDirections(), rng);
    }

    private static embedHeavy(
        spec: ICompactMoleculeSpec,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
    ): IPlacedAtom[] {
        const n = spec.heavy.length;
        const placed: Array<IPlacedAtom | null> = new Array(n).fill(null);
        const adjacency: number[][][] = [];
        for (let i = 0; i < n; i++) {
            adjacency.push([]);
        }
        for (const b of bonds) {
            adjacency[b.a].push([b.b, b.order]);
            adjacency[b.b].push([b.a, b.order]);
        }
        const rng = MoleculeFactory.mulberry(MoleculeFactory.hashSeed(spec.id));
        let component = 0;
        for (let start = 0; start < n; start++) {
            if (placed[start] !== null) {
                continue;
            }
            const offsetX = component * 8;
            component++;
            placed[start] = { el: spec.heavy[start], x: offsetX, y: 0, z: 0 };
            const queue: number[] = [start];
            const parent = new Map<number, number>();
            const usedSlots = new Map<number, Set<number>>();
            parent.set(start, -1);
            while (queue.length > 0) {
                const current = queue.shift() as number;
                const neighbors = adjacency[current];
                const dirs = MoleculeFactory.neighborDirections(neighbors.length, rng);
                const used = usedSlots.get(current) ?? new Set<number>();
                usedSlots.set(current, used);
                const par = parent.get(current) as number;
                let incoming: number[] | null = null;
                if (par >= 0) {
                    const p = placed[current] as IPlacedAtom;
                    const q = placed[par] as IPlacedAtom;
                    const dx = q.x - p.x;
                    const dy = q.y - p.y;
                    const dz = q.z - p.z;
                    const inv = 1 / (Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-9);
                    incoming = [dx * inv, dy * inv, dz * inv];
                }
                for (const [next, order] of neighbors) {
                    if (placed[next] !== null) {
                        continue;
                    }
                    let best = -1;
                    let bestScore = Infinity;
                    for (let s = 0; s < dirs.length; s++) {
                        if (used.has(s)) {
                            continue;
                        }
                        const score =
                            incoming === null
                                ? s
                                : dirs[s][0] * incoming[0] +
                                  dirs[s][1] * incoming[1] +
                                  dirs[s][2] * incoming[2];
                        if (score < bestScore) {
                            bestScore = score;
                            best = s;
                        }
                    }
                    /* v8 ignore next -- defensive: no molecule exceeds its coordination set, so a direction is always free */
                    if (best < 0) {
                        best = 0;
                    }
                    used.add(best);
                    parent.set(next, current);
                    const dir = dirs[best % dirs.length];
                    const len = ElementRegistry.bondLength(
                        spec.heavy[current],
                        spec.heavy[next],
                        order,
                    );
                    const p = placed[current] as IPlacedAtom;
                    placed[next] = {
                        el: spec.heavy[next],
                        x: p.x + dir[0] * len,
                        y: p.y + dir[1] * len,
                        z: p.z + dir[2] * len,
                    };
                    queue.push(next);
                }
            }
        }
        const result: IPlacedAtom[] = [];
        for (const p of placed) {
            result.push(p as IPlacedAtom);
        }
        return result;
    }

    private static relax(
        atoms: IPlacedAtom[],
        elements: ReadonlyArray<string>,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
        rng: () => number,
    ): void {
        void rng;
        const n = atoms.length;
        const bondCount = bonds.length;
        const idealArr = new Float64Array(bondCount);
        const bondedPairs = new Set<number>();
        for (let i = 0; i < bondCount; i++) {
            const b = bonds[i];
            idealArr[i] = ElementRegistry.bondLength(elements[b.a], elements[b.b], b.order);
            bondedPairs.add(b.a * n + b.b);
            bondedPairs.add(b.b * n + b.a);
        }
        const OFF = 2048;
        const SPAN = 4096;
        const cellKey = (x: number, y: number, z: number): number =>
            ((x + OFF) * SPAN + (y + OFF)) * SPAN + (z + OFF);
        const cell = 2.5;
        const resolveOverlaps = (): boolean => {
            const grid = new Map<number, number[]>();
            for (let i = 0; i < n; i++) {
                const a = atoms[i];
                const key = cellKey(
                    Math.floor(a.x / cell),
                    Math.floor(a.y / cell),
                    Math.floor(a.z / cell),
                );
                const list = grid.get(key);
                if (list === undefined) {
                    grid.set(key, [i]);
                } else {
                    list.push(i);
                }
            }
            let found = false;
            for (let i = 0; i < n; i++) {
                const a = atoms[i];
                const cx = Math.floor(a.x / cell);
                const cy = Math.floor(a.y / cell);
                const cz = Math.floor(a.z / cell);
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const list = grid.get(cellKey(cx + dx, cy + dy, cz + dz));
                            if (list === undefined) {
                                continue;
                            }
                            for (const j of list) {
                                if (j <= i) {
                                    continue;
                                }
                                if (bondedPairs.has(i * n + j)) {
                                    continue;
                                }
                                const p = atoms[i];
                                const q = atoms[j];
                                const ddx = q.x - p.x;
                                const ddy = q.y - p.y;
                                const ddz = q.z - p.z;
                                const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                                if (d2 < 1.44 && d2 > 1e-12) {
                                    found = true;
                                    const dist = Math.sqrt(d2);
                                    const overlap = 1.2 - dist;
                                    const push = (overlap / dist) * 0.3;
                                    p.x -= ddx * push;
                                    p.y -= ddy * push;
                                    p.z -= ddz * push;
                                    q.x += ddx * push;
                                    q.y += ddy * push;
                                    q.z += ddz * push;
                                }
                            }
                        }
                    }
                }
            }
            return found;
        };
        const budget = 400;
        let overlapping = true;
        for (let iter = 0; iter < budget; iter++) {
            let maxError = 0;
            for (let bi = 0; bi < bondCount; bi++) {
                const b = bonds[bi];
                const p = atoms[b.a];
                const q = atoms[b.b];
                const ideal = idealArr[bi];
                const dx = q.x - p.x;
                const dy = q.y - p.y;
                const dz = q.z - p.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-9;
                const err = Math.abs(dist - ideal);
                if (err > maxError) {
                    maxError = err;
                }
                const push = ((dist - ideal) / dist) * 0.3;
                p.x += dx * push;
                p.y += dy * push;
                p.z += dz * push;
                q.x -= dx * push;
                q.y -= dy * push;
                q.z -= dz * push;
            }
            if (overlapping || iter % 32 === 0) {
                const found = resolveOverlaps();
                if (found) {
                    maxError = Math.max(maxError, 1.2);
                }
                overlapping = found;
            }
            if (maxError < 0.15 && !overlapping && iter > 30) {
                break;
            }
        }
    }

    private static addHydrogens(
        spec: ICompactMoleculeSpec,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
        placed: IPlacedAtom[],
        hCounts: ReadonlyArray<number>,
    ): { atoms: IPlacedAtom[]; bonds: Array<{ a: number; b: number; order: number }> } {
        const result = [...placed];
        const allBonds: Array<{ a: number; b: number; order: number }> = bonds.map((b) => ({
            a: b.a,
            b: b.b,
            order: b.order,
        }));
        const rng = MoleculeFactory.mulberry(MoleculeFactory.hashSeed(spec.id + ":h"));
        const adjacency: number[][] = [];
        for (let i = 0; i < spec.heavy.length; i++) {
            adjacency.push([]);
        }
        for (const b of bonds) {
            adjacency[b.a].push(b.b);
            adjacency[b.b].push(b.a);
        }
        for (let i = 0; i < spec.heavy.length; i++) {
            const count = hCounts[i];
            if (count <= 0) {
                continue;
            }
            const p = placed[i];
            const used = adjacency[i].map((j) => {
                const q = placed[j];
                const dx = q.x - p.x;
                const dy = q.y - p.y;
                const dz = q.z - p.z;
                const inv = 1 / (Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-9);
                return [dx * inv, dy * inv, dz * inv];
            });
            const candidates = MoleculeFactory.rotate(MoleculeFactory.tetraDirections(), rng);
            const scored = candidates.map((dir) => {
                let worst = Infinity;
                for (const u of used) {
                    const dot = dir[0] * u[0] + dir[1] * u[1] + dir[2] * u[2];
                    if (dot < worst) {
                        worst = dot;
                    }
                }
                return { dir, worst };
            });
            scored.sort((a, b) => a.worst - b.worst);
            const len = ElementRegistry.bondLength(spec.heavy[i], "H", 1);
            for (let k = 0; k < count && k < scored.length; k++) {
                const dir = scored[k].dir;
                allBonds.push({ a: i, b: result.length, order: 1 });
                result.push({
                    el: "H",
                    x: p.x + dir[0] * len,
                    y: p.y + dir[1] * len,
                    z: p.z + dir[2] * len,
                });
            }
        }
        return { atoms: result, bonds: allBonds };
    }

    private static computeMass(atoms: ReadonlyArray<IPlacedAtom>): number {
        let mass = 0;
        for (const a of atoms) {
            mass += ElementRegistry.get(a.el).mass;
        }
        return Math.round(mass * 100) / 100;
    }

    private static estimateProperties(
        spec: ICompactMoleculeSpec,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
        hCounts: ReadonlyArray<number>,
    ): IMoleculeProperties {
        let donors = 0;
        let acceptors = 0;
        for (let i = 0; i < spec.heavy.length; i++) {
            const el = spec.heavy[i];
            if ((el === "O" || el === "N") && hCounts[i] > 0) {
                donors += hCounts[i];
            }
            if (el === "O" || el === "N") {
                acceptors += 1;
            }
        }
        let rotatable = 0;
        for (const b of bonds) {
            if (b.order === 1) {
                rotatable += 1;
            }
        }
        let carbons = 0;
        let hetero = 0;
        for (const el of spec.heavy) {
            if (el === "C") {
                carbons += 1;
            } else if (el !== "H") {
                hetero += 1;
            }
        }
        return {
            logP: Math.round((carbons * 0.3 - hetero * 0.8) * 100) / 100,
            hBondDonors: donors,
            hBondAcceptors: acceptors,
            rotatable,
            tpsa: Math.round(acceptors * 12.5 * 100) / 100,
        };
    }

    private static toAtomSpecs(
        spec: ICompactMoleculeSpec,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
        atoms: ReadonlyArray<IPlacedAtom>,
        charges: ReadonlyMap<number, number>,
    ): IAtomSpec[] {
        const neighborElements: string[][] = [];
        for (let i = 0; i < spec.heavy.length; i++) {
            neighborElements.push([]);
        }
        for (const b of bonds) {
            neighborElements[b.a].push(spec.heavy[b.b]);
            neighborElements[b.b].push(spec.heavy[b.a]);
        }
        const result: IAtomSpec[] = [];
        for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i];
            let stereo: string | null = null;
            if (i < spec.heavy.length && a.el !== "H") {
                const neighbors = neighborElements[i];
                if (neighbors.length === 4 && new Set(neighbors).size === 4) {
                    stereo = i % 2 === 0 ? "R" : "S";
                }
            }
            result.push({
                el: a.el,
                x: Math.round(a.x * 1000) / 1000,
                y: Math.round(a.y * 1000) / 1000,
                z: Math.round(a.z * 1000) / 1000,
                charge: i < spec.heavy.length ? (charges.get(i) ?? 0) : 0,
                stereo,
                aromatic: MoleculeFactory.isAromaticHeavy(i, spec, bonds),
            });
        }
        return result;
    }

    private static isAromaticHeavy(
        index: number,
        spec: ICompactMoleculeSpec,
        bonds: ReadonlyArray<{ a: number; b: number; order: number }>,
    ): boolean {
        void spec;
        for (const b of bonds) {
            if (b.order === 4 && (b.a === index || b.b === index)) {
                return true;
            }
        }
        return false;
    }

    private static toBondSpecs(
        bonds: ReadonlyArray<{ a: number; b: number; order: number; stereo: string | null }>,
    ): IBondSpec[] {
        return bonds.map((b) => ({
            a: b.a,
            b: b.b,
            order: (b.order > 4 ? 1 : b.order) as BondOrder,
            aromatic: b.order === 4,
            stereo: b.stereo,
        }));
    }
}
