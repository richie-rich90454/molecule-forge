pub mod force_calculator;
pub mod reaction_rule;
pub mod spatial_hash;
pub mod world;

pub use force_calculator::{
    CoulombCalculator, ForceCalculator, HydrogenBondCalculator, LennardJonesCalculator,
};
pub use reaction_rule::{ReactionCondition, ReactionRule};
pub use spatial_hash::SpatialHashGrid;
pub use world::{MoleculeBody, World};

use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct EngineHandle {
    world: World,
}

impl Default for EngineHandle {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl EngineHandle {
    pub fn new() -> EngineHandle {
        EngineHandle {
            world: World::new(),
        }
    }

    pub fn body_count(&self) -> usize {
        self.world.len()
    }

    #[allow(clippy::too_many_arguments)]
    pub fn step_forces(
        &self,
        positions: &[f64],
        radii: &[f64],
        charges: &[f64],
        donors: &[f64],
        acceptors: &[f64],
        epsilon: f64,
        dielectric: f64,
        cutoff: f64,
        hb_strength: f64,
        hb_distance: f64,
        out_forces: &mut [f64],
    ) {
        let count = radii
            .len()
            .min(charges.len())
            .min(donors.len())
            .min(acceptors.len())
            .min(positions.len() / 3)
            .min(out_forces.len() / 3);
        let calculators: Vec<Box<dyn ForceCalculator>> = vec![
            Box::new(LennardJonesCalculator::new(epsilon)),
            Box::new(CoulombCalculator::new(dielectric)),
        ];
        let hb = HydrogenBondCalculator::new(hb_strength, hb_distance);
        for v in out_forces.iter_mut() {
            *v = 0.0;
        }
        for i in 0..count {
            for j in (i + 1)..count {
                let dx = positions[i * 3] - positions[j * 3];
                let dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                let dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                let dist_sq = dx * dx + dy * dy + dz * dz;
                if dist_sq > cutoff * cutoff || dist_sq < 1e-12 {
                    continue;
                }
                let dist = dist_sq.sqrt();
                let mut total = 0.0;
                for calc in calculators.iter() {
                    total +=
                        calc.magnitude(dist, (radii[i] + radii[j]) * 0.5, charges[i], charges[j]);
                }
                total += hb.pair_magnitude(
                    dist,
                    donors[i] as u32 + donors[j] as u32,
                    acceptors[i] as u32 + acceptors[j] as u32,
                );
                total = total.clamp(-4000.0, 4000.0);
                let scale = total / dist;
                out_forces[i * 3] += dx * scale;
                out_forces[i * 3 + 1] += dy * scale;
                out_forces[i * 3 + 2] += dz * scale;
                out_forces[j * 3] -= dx * scale;
                out_forces[j * 3 + 1] -= dy * scale;
                out_forces[j * 3 + 2] -= dz * scale;
            }
        }
    }
}

const CELL: f64 = 10.0;
const KEY_SPAN: i64 = 4096;
const KEY_OFFSET: i64 = 2048;
const FORCE_CLAMP: f64 = 4000.0;

#[inline]
fn cell_key(cx: i64, cy: i64, cz: i64) -> i64 {
    ((cx + KEY_OFFSET) * KEY_SPAN + (cy + KEY_OFFSET)) * KEY_SPAN + (cz + KEY_OFFSET)
}

#[inline]
#[allow(clippy::too_many_arguments)]
fn query_range(
    radius_a: f64,
    charge_a: f64,
    donors_a: f64,
    acceptors_a: f64,
    partner_radius: f64,
    partner_donors: f64,
    partner_acceptors: f64,
    lj_cutoff_scale: f64,
    coulomb_cutoff: f64,
    hb_distance: f64,
    cutoff: f64,
) -> f64 {
    let lj = (radius_a + partner_radius) * 0.5 * lj_cutoff_scale;
    let coulomb = if charge_a == 0.0 { 0.0 } else { coulomb_cutoff };
    let hb = if donors_a + partner_donors == 0.0 || acceptors_a + partner_acceptors == 0.0 {
        0.0
    } else {
        hb_distance
    };
    lj.max(coulomb).max(hb).min(cutoff)
}

/// Computes pairwise forces with the same logic as the TypeScript engine:
/// a packed-key spatial grid, a per-instance adaptive query range derived from
/// the calculators, and a per-pair range cull before each force evaluation.
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn compute_forces(
    positions: &[f64],
    radii: &[f64],
    charges: &[f64],
    donors: &[f64],
    acceptors: &[f64],
    masses: &[f64],
    max_radius: f64,
    has_donor: bool,
    has_acceptor: bool,
    epsilon: f64,
    lj_cutoff_scale: f64,
    coulomb_strength: f64,
    coulomb_cutoff: f64,
    dielectric: f64,
    hb_strength: f64,
    hb_distance: f64,
    cutoff: f64,
    out_forces: &mut [f64],
) {
    let count = (positions.len() / 3)
        .min(radii.len())
        .min(charges.len())
        .min(donors.len())
        .min(acceptors.len())
        .min(masses.len())
        .min(out_forces.len() / 3);
    for value in out_forces[..count * 3].iter_mut() {
        *value = 0.0;
    }
    if count == 0 {
        return;
    }
    let mut grid: HashMap<i64, Vec<u32>> = HashMap::new();
    for i in 0..count {
        let key = cell_key(
            (positions[i * 3] / CELL).floor() as i64,
            (positions[i * 3 + 1] / CELL).floor() as i64,
            (positions[i * 3 + 2] / CELL).floor() as i64,
        );
        grid.entry(key).or_default().push(i as u32);
    }
    let partner_donors = if has_donor { 1.0 } else { 0.0 };
    let partner_acceptors = if has_acceptor { 1.0 } else { 0.0 };
    let cutoff_sq = cutoff * cutoff;
    for i in 0..count {
        let ax = positions[i * 3];
        let ay = positions[i * 3 + 1];
        let az = positions[i * 3 + 2];
        let ra = radii[i];
        let ca = charges[i];
        let da = donors[i];
        let aa = acceptors[i];
        let query = query_range(
            ra,
            ca,
            da,
            aa,
            max_radius,
            partner_donors,
            partner_acceptors,
            lj_cutoff_scale,
            coulomb_cutoff,
            hb_distance,
            cutoff,
        );
        if query <= 0.0 {
            continue;
        }
        let min_x = ((ax - query) / CELL).floor() as i64;
        let max_x = ((ax + query) / CELL).floor() as i64;
        let min_y = ((ay - query) / CELL).floor() as i64;
        let max_y = ((ay + query) / CELL).floor() as i64;
        let min_z = ((az - query) / CELL).floor() as i64;
        let max_z = ((az + query) / CELL).floor() as i64;
        let r2 = query * query;
        for cx in min_x..=max_x {
            for cy in min_y..=max_y {
                for cz in min_z..=max_z {
                    let Some(bucket) = grid.get(&cell_key(cx, cy, cz)) else {
                        continue;
                    };
                    for &ju in bucket.iter() {
                        let j = ju as usize;
                        if j <= i {
                            continue;
                        }
                        let dx = ax - positions[j * 3];
                        let dy = ay - positions[j * 3 + 1];
                        let dz = az - positions[j * 3 + 2];
                        let dist_sq = dx * dx + dy * dy + dz * dz;
                        if dist_sq > r2 || dist_sq > cutoff_sq || dist_sq < 1e-12 {
                            continue;
                        }
                        let dist = dist_sq.sqrt();
                        let rb = radii[j];
                        let cb = charges[j];
                        let db = donors[j];
                        let ab = acceptors[j];
                        let mut total = 0.0;
                        let sigma = (ra + rb) * 0.5;
                        if sigma > 0.0 && dist <= sigma * lj_cutoff_scale {
                            let s_over_r = sigma / dist;
                            let s6 =
                                s_over_r * s_over_r * s_over_r * s_over_r * s_over_r * s_over_r;
                            let s12 = s6 * s6;
                            let magnitude = (24.0 * epsilon * (2.0 * s12 - s6)) / (dist * dist);
                            total += magnitude * dist;
                        }
                        if ca != 0.0 && cb != 0.0 && dist <= coulomb_cutoff {
                            let qq = ca * cb * coulomb_strength;
                            total += qq / (dielectric * dist * dist);
                        }
                        let donor_count = da + db;
                        let acceptor_count = aa + ab;
                        if donor_count > 0.0 && acceptor_count > 0.0 && dist <= hb_distance {
                            let pairs = donor_count.min(acceptor_count);
                            let falloff = 1.0 - dist / hb_distance;
                            total += -hb_strength * pairs * falloff * falloff / dist;
                        }
                        total = total.clamp(-FORCE_CLAMP, FORCE_CLAMP);
                        if total == 0.0 {
                            continue;
                        }
                        let scale = total / dist;
                        out_forces[i * 3] += dx * scale / masses[i];
                        out_forces[i * 3 + 1] += dy * scale / masses[i];
                        out_forces[i * 3 + 2] += dz * scale / masses[i];
                        out_forces[j * 3] -= dx * scale / masses[j];
                        out_forces[j * 3 + 1] -= dy * scale / masses[j];
                        out_forces[j * 3 + 2] -= dz * scale / masses[j];
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{cell_key, compute_forces};

    #[allow(clippy::too_many_arguments)]
    fn run(positions: &[f64], radii: &[f64], charges: &[f64]) -> Vec<f64> {
        let n = radii.len();
        let mut out = vec![0.0; n * 3];
        compute_forces(
            positions,
            radii,
            charges,
            &vec![0.0; n],
            &vec![0.0; n],
            &vec![1.0; n],
            radii.iter().cloned().fold(0.0, f64::max),
            false,
            false,
            2.2,
            3.0,
            60.0,
            20.0,
            20.0,
            3.0,
            3.5,
            10.0,
            &mut out,
        );
        out
    }

    #[test]
    fn same_cell_key_matches_ts_packing() {
        assert_eq!(cell_key(0, 0, 0), (2048i64 * 4096 + 2048) * 4096 + 2048);
    }

    #[test]
    fn repels_two_close_neutral_bodies() {
        let positions = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0];
        let forces = run(&positions, &[1.0, 1.0], &[0.0, 0.0]);
        assert!(forces[0] < 0.0);
        assert!(forces[3] > 0.0);
    }

    #[test]
    fn ignores_pairs_beyond_the_cutoff() {
        let positions = [0.0, 0.0, 0.0, 50.0, 0.0, 0.0];
        let forces = run(&positions, &[1.0, 1.0], &[0.0, 0.0]);
        assert_eq!(forces, vec![0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    }

    #[test]
    fn couples_bodies_across_adjacent_cells() {
        let positions = [9.9, 0.0, 0.0, 10.1, 0.0, 0.0];
        let forces = run(&positions, &[2.0, 2.0], &[1.0, 1.0]);
        assert!(forces[0] < 0.0);
        assert!(forces[3] > 0.0);
    }

    #[test]
    fn unmatched_lengths_are_truncated() {
        let positions = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0];
        let forces = run(&positions, &[1.0, 1.0], &[0.0]);
        assert_eq!(forces.len(), 6);
    }
}
