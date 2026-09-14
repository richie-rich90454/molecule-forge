/* tslint:disable */
/* eslint-disable */

export class EngineHandle {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    body_count(): number;
    static new(): EngineHandle;
    step_forces(positions: Float64Array, radii: Float64Array, charges: Float64Array, donors: Float64Array, acceptors: Float64Array, epsilon: number, dielectric: number, cutoff: number, hb_strength: number, hb_distance: number, out_forces: Float64Array): void;
}

/**
 * Computes pairwise forces with the same logic as the TypeScript engine:
 * a packed-key spatial grid, a per-instance adaptive query range derived from
 * the calculators, and a per-pair range cull before each force evaluation.
 */
export function compute_forces(positions: Float64Array, radii: Float64Array, charges: Float64Array, donors: Float64Array, acceptors: Float64Array, masses: Float64Array, max_radius: number, has_donor: boolean, has_acceptor: boolean, epsilon: number, lj_cutoff_scale: number, coulomb_strength: number, coulomb_cutoff: number, dielectric: number, hb_strength: number, hb_distance: number, cutoff: number, out_forces: Float64Array): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_enginehandle_free: (a: number, b: number) => void;
    readonly compute_forces: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number, x: number, y: number, z: any) => void;
    readonly enginehandle_body_count: (a: number) => number;
    readonly enginehandle_new: () => number;
    readonly enginehandle_step_forces: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: any) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
