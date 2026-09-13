import { SolventModel } from "../chem/SolventModel";
import type { SynthesisKind } from "../chem/CompoundSynthesizer";
import type { World } from "./World";

export class ReactionGate {
    public static activity(world: World): number {
        const charges: number[] = [];
        for (const inst of world.getInstanceList()) {
            for (const atom of inst.record.atoms) {
                if (atom.charge !== 0) {
                    charges.push(atom.charge);
                }
            }
        }
        return SolventModel.activity(1, charges, world.boxSize * world.boxSize * world.boxSize);
    }

    public static allow(enthalpy: number | null, kind: SynthesisKind, world: World): boolean {
        const temperature = world.params.temperature;
        const spark = world.params.spark;
        if (temperature <= 5) {
            return false;
        }
        if (kind === "covalent" && temperature < 250 && spark <= 0.05) {
            return false;
        }
        if (enthalpy === null) {
            return true;
        }
        const effective = enthalpy / Math.max(0.2, ReactionGate.activity(world));
        return !(effective > 100 && temperature < 800 && spark <= 0.05);
    }

    public static activationEnergy(enthalpy: number, world: World): number {
        const effective = enthalpy / Math.max(0.2, ReactionGate.activity(world));
        return Math.max(0, 0.25 * effective + 80);
    }
}
