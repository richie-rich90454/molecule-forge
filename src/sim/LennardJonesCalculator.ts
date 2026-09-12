import type { IForceCalculator, IPairInput } from "./IForceCalculator";

export class LennardJonesCalculator implements IForceCalculator {
    private readonly epsilon: number;
    private readonly cutoffScale: number;

    public constructor(epsilon: number, cutoffScale: number) {
        this.epsilon = epsilon;
        this.cutoffScale = cutoffScale;
    }

    public getName(): string {
        return "LennardJones";
    }

    public computeMagnitude(input: IPairInput): number {
        const sigma = (input.aRadius + input.bRadius) * 0.5;
        if (sigma <= 0 || input.dist <= 1e-6) {
            return 0;
        }
        if (input.dist > sigma * this.cutoffScale) {
            return 0;
        }
        const sOverR = sigma / input.dist;
        const s6 = sOverR * sOverR * sOverR * sOverR * sOverR * sOverR;
        const s12 = s6 * s6;
        const epsilon = this.epsilon * input.params.bondStrength;
        const magnitude = (24 * epsilon * (2 * s12 - s6)) / (input.dist * input.dist);
        return magnitude * input.dist;
    }
}
