import type {
    IForceCalculator,
    IPairBody,
    IPairInput,
    ISimParams,
    MutablePairInput,
} from "./IForceCalculator";
import type { MoleculeInstance } from "./MoleculeInstance";
import { SeededRandom } from "./SeededRandom";
import { SpatialHashGrid } from "./SpatialHashGrid";
import type { World } from "./World";

export class PhysicsEngine {
    private readonly calculators: ReadonlyArray<IForceCalculator>;
    private readonly grid: SpatialHashGrid<MoleculeInstance>;
    private readonly pairInput: MutablePairInput;
    private readonly scratch: MoleculeInstance[];
    private readonly maxPartner: {
        radius: number;
        charge: number;
        donors: number;
        acceptors: number;
    };

    public constructor(calculators: ReadonlyArray<IForceCalculator>, params: ISimParams) {
        this.calculators = calculators;
        this.grid = new SpatialHashGrid<MoleculeInstance>(10);
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
        this.scratch = [];
        this.maxPartner = { radius: 0, charge: 1, donors: 0, acceptors: 0 };
    }

    public step(world: World, dt: number, rng: SeededRandom): void {
        const instances = world.getInstanceList();
        const params = world.params;
        (this.pairInput as MutablePairInput).params = params;
        let maxRadius = 0;
        let hasDonor = false;
        let hasAcceptor = false;
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
            if (inst.radius > maxRadius) {
                maxRadius = inst.radius;
            }
            if (inst.donors > 0) {
                hasDonor = true;
            }
            if (inst.acceptors > 0) {
                hasAcceptor = true;
            }
        }
        this.grid.clear();
        for (const inst of instances) {
            if (inst.alive) {
                this.grid.insert(inst);
            }
        }
        const cutoff = 10;
        const partner = this.maxPartner;
        partner.radius = maxRadius;
        partner.donors = hasDonor ? 1 : 0;
        partner.acceptors = hasAcceptor ? 1 : 0;
        for (const a of instances) {
            if (!a.alive) {
                continue;
            }
            this.grid.queryRadius(
                a.px,
                a.py,
                a.pz,
                this.queryRange(a, partner, cutoff),
                this.scratch,
            );
            for (const b of this.scratch) {
                if (b.id <= a.id || !b.alive) {
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
                let range = 0;
                let known = true;
                for (const calc of this.calculators) {
                    if (calc.getRange === undefined) {
                        known = false;
                        break;
                    }
                    const limit = calc.getRange(a, b);
                    if (limit > range) {
                        range = limit;
                    }
                }
                if (known && dist > range) {
                    continue;
                }
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
                mutable.aDonors = a.donors;
                mutable.aAcceptors = a.acceptors;
                mutable.bDonors = b.donors;
                mutable.bAcceptors = b.acceptors;
                let total = 0;
                for (const calc of this.calculators) {
                    total += calc.computeMagnitude(input);
                }
                if (total > 4000) {
                    total = 4000;
                } else if (total < -4000) {
                    total = -4000;
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
            const speedSq = inst.vx * inst.vx + inst.vy * inst.vy + inst.vz * inst.vz;
            if (speedSq > 14400) {
                const slow = 120 / (Math.sqrt(speedSq) + 1e-9);
                inst.vx *= slow;
                inst.vy *= slow;
                inst.vz *= slow;
            }
            if (
                !Number.isFinite(inst.px + inst.py + inst.pz + inst.vx + inst.vy + inst.vz) ||
                !Number.isFinite(inst.qw + inst.qx + inst.qy + inst.qz)
            ) {
                inst.px = 0;
                inst.py = 0;
                inst.pz = 0;
                inst.vx = 0;
                inst.vy = 0;
                inst.vz = 0;
                inst.qx = 0;
                inst.qy = 0;
                inst.qz = 0;
                inst.qw = 1;
            }
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

    private queryRange(a: MoleculeInstance, partner: IPairBody, cutoff: number): number {
        let range = 0;
        for (const calc of this.calculators) {
            if (calc.getRange === undefined) {
                return cutoff;
            }
            const limit = calc.getRange(a, partner);
            if (limit > range) {
                range = limit;
            }
        }
        return range > cutoff ? cutoff : range;
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
