import type { IForceCalculator, IPairInput } from "./IForceCalculator";

export class CoulombCalculator implements IForceCalculator {
    private readonly strength: number;
    private readonly cutoff: number;

    public constructor(strength: number, cutoff: number) {
        this.strength = strength;
        this.cutoff = cutoff;
    }

    public getName(): string {
        return "Coulomb";
    }

    public computeMagnitude(input: IPairInput): number {
        if (input.aCharge === 0 || input.bCharge === 0) {
            return 0;
        }
        if (input.dist <= 1e-6 || input.dist > this.cutoff) {
            return 0;
        }
        const dielectric = 1 + input.params.polarity * 40;
        const qq = input.aCharge * input.bCharge * this.strength;
        return qq / (dielectric * input.dist * input.dist);
    }
}
