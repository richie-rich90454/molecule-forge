import type {
    IForceCalculator,
    IPairInput,
    ISimParams,
    MutablePairInput,
} from "./IForceCalculator";
import { SeededRandom } from "./SeededRandom";
import { SpatialHashGrid } from "./SpatialHashGrid";
import type { World } from "./World";

export class PhysicsEngine {
    private readonly calculators: ReadonlyArray<IForceCalculator>;
    private readonly grid: SpatialHashGrid;
    private readonly pairInput: MutablePairInput;
    private readonly scratchIds: number[];

    public constructor(calculators: ReadonlyArray<IForceCalculator>, params: ISimParams) {
        this.calculators = calculators;
        this.grid = new SpatialHashGrid(6);
        this.pairInput = {
            ax: 0,
            ay: 0,
            az: 0,
            bx: 0,
            by: 0,
            bz: 0,
            dist: 0,
            aRadius: 0,
            bRadius: 0,
            aCharge: 0,
            bCharge: 0,
            aDonors: 0,
            aAcceptors: 0,
            bDonors: 0,
            bAcceptors: 0,
            params,
        };
        this.scratchIds = [];
    }

    public step(world: World, dt: number, rng: SeededRandom): void {
        const instances = world.getInstanceList();
        const params = world.params;
        (this.pairInput as MutablePairInput).params = params;
        for (const inst of instances) {
            if (!inst.alive) {
                continue;
            }
            inst.vx += inst.ax * dt * 0.5;
            inst.vy += inst.ay * dt * 0.5;
            inst.vz += inst.az * dt * 0.5;
            inst.px += inst.vx * dt;
            inst.py += inst.vy * dt;
            inst.pz += inst.vz * dt;
            inst.ax = 0;
            inst.ay = 0;
            inst.az = 0;
        }
        this.grid.clear();
        for (const inst of instances) {
            if (inst.alive) {
                this.grid.insert(inst.id, inst.px, inst.py, inst.pz);
            }
        }
        const cutoff = 10;
        for (const a of instances) {
            if (!a.alive) {
                continue;
            }
            this.grid.queryRadius(a.px, a.py, a.pz, cutoff, this.scratchIds);
            for (const otherId of this.scratchIds) {
                if (otherId <= a.id) {
                    continue;
                }
                const b = world.findById(otherId);
                if (b === undefined || !b.alive) {
                    continue;
                }
                const dx = a.px - b.px;
                const dy = a.py - b.py;
                const dz = a.pz - b.pz;
                const distSq = dx * dx + dy * dy + dz * dz;
                if (distSq > cutoff * cutoff || distSq < 1e-12) {
                    continue;
                }
                const dist = Math.sqrt(distSq);
                const input = this.pairInput;
                const mutable = input as { -readonly [K in keyof IPairInput]: IPairInput[K] };
                mutable.ax = a.px;
                mutable.ay = a.py;
                mutable.az = a.pz;
                mutable.bx = b.px;
                mutable.by = b.py;
                mutable.bz = b.pz;
                mutable.dist = dist;
                mutable.aRadius = a.radius;
                mutable.bRadius = b.radius;
                mutable.aCharge = a.charge;
                mutable.bCharge = b.charge;
                mutable.aDonors = a.getDonors();
                mutable.aAcceptors = a.getAcceptors();
                mutable.bDonors = b.getDonors();
                mutable.bAcceptors = b.getAcceptors();
                let total = 0;
                for (const calc of this.calculators) {
                    total += calc.computeMagnitude(input);
                }
                const scale = total / dist;
                const fx = dx * scale;
                const fy = dy * scale;
                const fz = dz * scale;
                a.ax += fx / a.mass;
                a.ay += fy / a.mass;
                a.az += fz / a.mass;
                b.ax -= fx / b.mass;
                b.ay -= fy / b.mass;
                b.az -= fz / b.mass;
            }
        }
        const kT = params.temperature * 0.02 + params.radiation * 9;
        const gamma = 0.5 + params.viscosity * 6;
        for (const inst of instances) {
            if (!inst.alive) {
                continue;
            }
            const thermal =
                Math.sqrt(Math.max(0, kT) / Math.max(1, inst.mass)) *
                (0.5 + params.temperature / 300);
            inst.ax += (rng.next() - 0.5) * thermal * 60;
            inst.ay += (rng.next() - 0.5) * thermal * 60 + params.gravity * -2.5;
            inst.az += (rng.next() - 0.5) * thermal * 60;
            const drag = Math.max(0, 1 - gamma * dt * 0.4);
            inst.vx = (inst.vx + inst.ax * dt * 0.5) * drag;
            inst.vy = (inst.vy + inst.ay * dt * 0.5) * drag;
            inst.vz = (inst.vz + inst.az * dt * 0.5) * drag;
            const half = world.boxSize * 0.5;
            if (inst.px > half) {
                inst.px = half;
                inst.vx = -Math.abs(inst.vx) * 0.6;
            } else if (inst.px < -half) {
                inst.px = -half;
                inst.vx = Math.abs(inst.vx) * 0.6;
            }
            if (inst.py > half) {
                inst.py = half;
                inst.vy = -Math.abs(inst.vy) * 0.6;
            } else if (inst.py < -half) {
                inst.py = -half;
                inst.vy = Math.abs(inst.vy) * 0.6;
            }
            if (inst.pz > half) {
                inst.pz = half;
                inst.vz = -Math.abs(inst.vz) * 0.6;
            } else if (inst.pz < -half) {
                inst.pz = -half;
                inst.vz = Math.abs(inst.vz) * 0.6;
            }
            const wobble = Math.min(3, params.temperature / 300);
            inst.avx += (rng.next() - 0.5) * wobble * dt * 4;
            inst.avy += (rng.next() - 0.5) * wobble * dt * 4;
            inst.avz += (rng.next() - 0.5) * wobble * dt * 4;
            inst.avx *= 1 - Math.min(0.9, dt * 2);
            inst.avy *= 1 - Math.min(0.9, dt * 2);
            inst.avz *= 1 - Math.min(0.9, dt * 2);
            PhysicsEngine.integrateQuaternion(inst, dt);
        }
    }

    public static integrateQuaternion(
        inst: {
            qx: number;
            qy: number;
            qz: number;
            qw: number;
            avx: number;
            avy: number;
            avz: number;
        },
        dt: number,
    ): void {
        const hx = inst.avx * dt * 0.5;
        const hy = inst.avy * dt * 0.5;
        const hz = inst.avz * dt * 0.5;
        const qw = inst.qw;
        const qx = inst.qx;
        const qy = inst.qy;
        const qz = inst.qz;
        inst.qw = qw - hx * qx - hy * qy - hz * qz;
        inst.qx = qx + hx * qw + hy * qz - hz * qy;
        inst.qy = qy - hx * qz + hy * qw + hz * qx;
        inst.qz = qz + hx * qy - hy * qx + hz * qw;
        const inv =
            1 /
            (Math.sqrt(
                inst.qw * inst.qw + inst.qx * inst.qx + inst.qy * inst.qy + inst.qz * inst.qz,
            ) +
                1e-12);
        inst.qw *= inv;
        inst.qx *= inv;
        inst.qy *= inv;
        inst.qz *= inv;
    }
}
