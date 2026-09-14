/* @ts-self-types="./molecule_forge_engine.d.ts" */
import * as wasm from "./molecule_forge_engine_bg.wasm";
import { __wbg_set_wasm } from "./molecule_forge_engine_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    EngineHandle, compute_forces
} from "./molecule_forge_engine_bg.js";
