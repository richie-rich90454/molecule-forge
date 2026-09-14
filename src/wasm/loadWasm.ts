import { compute_forces } from "./engine/pkg/molecule_forge_engine.js";
import type { IWasmForceModule } from "../sim/ForceField";

export async function loadWasmModule(): Promise<IWasmForceModule | null> {
    return { compute_forces };
}
