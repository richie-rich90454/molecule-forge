import { Thermochemistry } from "./Thermochemistry";

const AVOGADRO = 6.02214076e23;
const ANGSTROM3_PER_LITRE = 1e27;

export class SolventModel {
    public static ionicStrength(charges: ReadonlyArray<number>, volume: number): number {
        let sum = 0;
        for (const charge of charges) {
            sum += charge * charge;
        }
        const molesPerLitrePerIon = ANGSTROM3_PER_LITRE / AVOGADRO / Math.max(1, volume);
        return 0.5 * sum * molesPerLitrePerIon;
    }

    public static activity(
        chargeProduct: number,
        charges: ReadonlyArray<number>,
        volume: number,
    ): number {
        return Thermochemistry.debyeHuckelActivity(
            chargeProduct,
            SolventModel.ionicStrength(charges, volume),
        );
    }
}
