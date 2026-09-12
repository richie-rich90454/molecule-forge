export interface IWorkerForceRequest {
    readonly requestId: number;
    readonly positions: Float64Array;
    readonly radii: Float64Array;
    readonly charges: Float64Array;
    readonly epsilon: number;
    readonly dielectric: number;
    readonly cutoff: number;
}

export interface IWorkerForceResponse {
    readonly requestId: number;
    readonly forces: Float64Array;
}

const WORKER_SOURCE = `
class WorkerForceField {
    constructor() {
        this.epsilon = 1.0;
        this.dielectric = 20.0;
        this.cutoff = 10.0;
    }
    computePair(ax, ay, az, bx, by, bz, aRadius, bRadius, aCharge, bCharge) {
        const dx = ax - bx;
        const dy = ay - by;
        const dz = az - bz;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq > this.cutoff * this.cutoff || distSq < 1e-12) {
            return [0, 0, 0];
        }
        const dist = Math.sqrt(distSq);
        let total = 0;
        const sigma = (aRadius + bRadius) * 0.5;
        if (sigma > 0 && dist < sigma * 3) {
            const sOverR = sigma / dist;
            const s6 = Math.pow(sOverR, 6);
            const s12 = s6 * s6;
            total += (24 * this.epsilon * (2 * s12 - s6)) / dist;
        }
        if (aCharge !== 0 && bCharge !== 0) {
            total += (aCharge * bCharge) / (this.dielectric * dist * dist);
        }
        const scale = total / dist;
        return [dx * scale, dy * scale, dz * scale];
    }
    computeAll(positions, radii, charges, count) {
        const forces = new Float64Array(count * 3);
        for (let i = 0; i < count; i++) {
            const ax = positions[i * 3];
            const ay = positions[i * 3 + 1];
            const az = positions[i * 3 + 2];
            for (let j = i + 1; j < count; j++) {
                const f = this.computePair(
                    ax, ay, az,
                    positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
                    radii[i], radii[j], charges[i], charges[j],
                );
                forces[i * 3] += f[0];
                forces[i * 3 + 1] += f[1];
                forces[i * 3 + 2] += f[2];
                forces[j * 3] -= f[0];
                forces[j * 3 + 1] -= f[1];
                forces[j * 3 + 2] -= f[2];
            }
        }
        return forces;
    }
}
const field = new WorkerForceField();
self.onmessage = (event) => {
    const data = event.data;
    field.epsilon = data.epsilon;
    field.dielectric = data.dielectric;
    field.cutoff = data.cutoff;
    const forces = field.computeAll(data.positions, data.radii, data.charges, data.count);
    self.postMessage({ requestId: data.requestId, forces }, [forces.buffer]);
};
`;

export class SimulationWorker {
    private worker: Worker | null;
    private nextRequestId: number;
    private readonly pending: Map<number, (forces: Float64Array) => void>;
    public readonly available: boolean;

    public constructor() {
        this.worker = null;
        this.nextRequestId = 1;
        this.pending = new Map();
        let ok = false;
        try {
            const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);
            const created = new Worker(url);
            created.onmessage = (event: MessageEvent): void => {
                const data = event.data as IWorkerForceResponse;
                const resolve = this.pending.get(data.requestId);
                if (resolve !== undefined) {
                    this.pending.delete(data.requestId);
                    resolve(data.forces);
                }
            };
            this.worker = created;
            ok = true;
        } catch (error) {
            void error;
            ok = false;
        }
        this.available = ok;
    }

    public computeForces(
        positions: Float64Array,
        radii: Float64Array,
        charges: Float64Array,
        count: number,
        epsilon: number,
        dielectric: number,
        cutoff: number,
    ): Promise<Float64Array> {
        if (this.worker === null) {
            return Promise.reject(new Error("worker unavailable"));
        }
        const requestId = this.nextRequestId++;
        return new Promise<Float64Array>((resolve) => {
            this.pending.set(requestId, resolve);
            const positionsCopy = new Float64Array(positions);
            const radiiCopy = new Float64Array(radii);
            const chargesCopy = new Float64Array(charges);
            this.worker?.postMessage(
                {
                    requestId,
                    positions: positionsCopy,
                    radii: radiiCopy,
                    charges: chargesCopy,
                    count,
                    epsilon,
                    dielectric,
                    cutoff,
                },
                [positionsCopy.buffer, radiiCopy.buffer, chargesCopy.buffer],
            );
        });
    }

    public dispose(): void {
        if (this.worker !== null) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pending.clear();
    }
}
