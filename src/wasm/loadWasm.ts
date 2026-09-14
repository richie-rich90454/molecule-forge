import init, { compute_forces } from "./engine/pkg/molecule_forge_engine.js";
import wasmUrl from "./engine/pkg/molecule_forge_engine_bg.wasm?url";
import type { IWasmForceModule } from "../sim/ForceField";

export async function loadWasmModule(): Promise<IWasmForceModule | null> {
    const response = await fetch(wasmUrl);
    const bytes = await response.arrayBuffer();
    await init({ module_or_path: bytes });
    return { compute_forces };
}
