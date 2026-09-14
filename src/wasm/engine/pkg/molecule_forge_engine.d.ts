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
 * a packed grid, a per-instance adaptive query range, and a per-pair range
 * cull before each force evaluation. Buffers are reused across calls.
 */
export function compute_forces(positions: Float64Array, radii: Float64Array, charges: Float64Array, donors: Float64Array, acceptors: Float64Array, masses: Float64Array, max_radius: number, has_donor: boolean, has_acceptor: boolean, epsilon: number, lj_cutoff_scale: number, coulomb_strength: number, coulomb_cutoff: number, dielectric: number, hb_strength: number, hb_distance: number, cutoff: number, out_forces: Float64Array): void;
