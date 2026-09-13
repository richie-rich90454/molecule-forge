import type { IMoleculeRecord } from "../chem/MoleculeRecord";

export class MoleculeInstance {
    private static nextId = 1;

    public readonly id: number;
    public readonly record: IMoleculeRecord;
    public readonly radius: number;
    public readonly mass: number;
    public readonly charge: number;
    public readonly donors: number;
    public readonly acceptors: number;
    public readonly jitterSeed: number;
    public px: number;
    public py: number;
    public pz: number;
    public prevPx: number;
    public prevPy: number;
    public prevPz: number;
    public vx: number;
    public vy: number;
    public vz: number;
    public ax: number;
    public ay: number;
    public az: number;
    public qx: number;
    public qy: number;
    public qz: number;
    public qw: number;
    public avx: number;
    public avy: number;
    public avz: number;
    public alive: boolean;

    public constructor(
        record: IMoleculeRecord,
        x: number,
        y: number,
        z: number,
        vx: number,
        vy: number,
        vz: number,
        jitterSeed: number,
    ) {
        this.id = MoleculeInstance.nextId++;
        this.record = record;
        this.px = x;
        this.py = y;
        this.pz = z;
        this.prevPx = x;
        this.prevPy = y;
        this.prevPz = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
        this.qx = 0;
        this.qy = 0;
        this.qz = 0;
        this.qw = 1;
        this.avx = 0;
        this.avy = 0;
        this.avz = 0;
        this.alive = true;
        this.jitterSeed = jitterSeed;
        let cx = 0;
        let cy = 0;
        let cz = 0;
        for (const atom of record.atoms) {
            cx += atom.x;
            cy += atom.y;
            cz += atom.z;
        }
        const n = Math.max(1, record.atoms.length);
        cx /= n;
        cy /= n;
        cz /= n;
        let maxD = 1.5;
        for (const atom of record.atoms) {
            const dx = atom.x - cx;
            const dy = atom.y - cy;
            const dz = atom.z - cz;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d > maxD) {
                maxD = d;
            }
        }
        this.radius = maxD;
        this.mass = record.mass;
        this.donors = record.properties.hBondDonors;
        this.acceptors = record.properties.hBondAcceptors;
        let charge = 0;
        for (const atom of record.atoms) {
            charge += atom.charge;
        }
        this.charge = charge;
    }

    public getDonors(): number {
        return this.donors;
    }

    public getAcceptors(): number {
        return this.acceptors;
    }

    public snapshotPrevious(): void {
        this.prevPx = this.px;
        this.prevPy = this.py;
        this.prevPz = this.pz;
    }
}
