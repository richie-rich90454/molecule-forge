import type { IForceCalculator, IPairInput } from "./IForceCalculator";

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
