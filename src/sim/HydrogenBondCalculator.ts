import type { IForceCalculator, IPairBody, IPairInput } from "./IForceCalculator";

export class HydrogenBondCalculator implements IForceCalculator {
    private readonly strength: number;
    private readonly maxDistance: number;

    public constructor(strength: number, maxDistance: number) {
        this.strength = strength;
        this.maxDistance = maxDistance;
    }

    public getName(): string {
        return "HydrogenBond";
    }

    public getRange(a: IPairBody, b: IPairBody): number {
        const donors = a.donors + b.donors;
        const acceptors = a.acceptors + b.acceptors;
        return donors === 0 || acceptors === 0 ? 0 : this.maxDistance;
    }

    public computeMagnitude(input: IPairInput): number {
        const donorCount = input.aDonors + input.bDonors;
        const acceptorCount = input.aAcceptors + input.bAcceptors;
        if (donorCount === 0 || acceptorCount === 0) {
            return 0;
        }
        if (input.dist <= 1e-6 || input.dist > this.maxDistance) {
            return 0;
        }
        const pairs = Math.min(donorCount, acceptorCount);
        const falloff = 1 - input.dist / this.maxDistance;
        return (-this.strength * pairs * falloff * falloff) / input.dist;
    }
}
