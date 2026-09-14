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

use std::cell::RefCell;
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
const FORCE_CLAMP: f64 = 4000.0;

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

/// Reusable flat spatial grid: one bucket-head array plus an intrusive linked
/// list, so a force pass allocates nothing after the first call.
#[derive(Default)]
struct Grid {
    head: Vec<i32>,
    next: Vec<i32>,
    origin_x: i32,
    origin_y: i32,
    origin_z: i32,
    dim_x: i32,
    dim_y: i32,
    dim_z: i32,
}

impl Grid {
    #[inline]
    fn cell_index(&self, cx: i32, cy: i32, cz: i32) -> usize {
        ((cx as usize * self.dim_y as usize) + cy as usize) * self.dim_z as usize + cz as usize
    }

    #[allow(clippy::too_many_arguments)]
    fn compute(
        &mut self,
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

        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut min_z = f64::INFINITY;
        let mut max_x = f64::NEG_INFINITY;
        let mut max_y = f64::NEG_INFINITY;
        let mut max_z = f64::NEG_INFINITY;
        for i in 0..count {
            let x = positions[i * 3];
            let y = positions[i * 3 + 1];
            let z = positions[i * 3 + 2];
            if x < min_x {
                min_x = x;
            }
            if x > max_x {
                max_x = x;
            }
            if y < min_y {
                min_y = y;
            }
            if y > max_y {
                max_y = y;
            }
            if z < min_z {
                min_z = z;
            }
            if z > max_z {
                max_z = z;
            }
        }
        self.origin_x = (min_x / CELL).floor() as i32;
        self.origin_y = (min_y / CELL).floor() as i32;
        self.origin_z = (min_z / CELL).floor() as i32;
        self.dim_x = ((max_x / CELL).floor() as i32 - self.origin_x + 1).max(1);
        self.dim_y = ((max_y / CELL).floor() as i32 - self.origin_y + 1).max(1);
        self.dim_z = ((max_z / CELL).floor() as i32 - self.origin_z + 1).max(1);

        let product = self.dim_x as usize * self.dim_y as usize * self.dim_z as usize;
        if self.head.len() < product {
            self.head.resize(product, -1);
        }
        for slot in self.head[..product].iter_mut() {
            *slot = -1;
        }
        if self.next.len() < count {
            self.next.resize(count, -1);
        }
        for i in (0..count).rev() {
            let cx = (positions[i * 3] / CELL).floor() as i32 - self.origin_x;
            let cy = (positions[i * 3 + 1] / CELL).floor() as i32 - self.origin_y;
            let cz = (positions[i * 3 + 2] / CELL).floor() as i32 - self.origin_z;
            let index = self.cell_index(cx, cy, cz);
            self.next[i] = self.head[index];
            self.head[index] = i as i32;
        }

        let partner_donors = if has_donor { 1.0 } else { 0.0 };
        let partner_acceptors = if has_acceptor { 1.0 } else { 0.0 };
        let dim_y = self.dim_y;
        let dim_z = self.dim_z;
        let last_x = self.dim_x - 1;
        let last_y = self.dim_y - 1;
        let last_z = self.dim_z - 1;
        let origin_x = self.origin_x;
        let origin_y = self.origin_y;
        let origin_z = self.origin_z;

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
            let min_cx = (((ax - query) / CELL).floor() as i32 - origin_x).clamp(0, last_x);
            let max_cx = (((ax + query) / CELL).floor() as i32 - origin_x).clamp(0, last_x);
            let min_cy = (((ay - query) / CELL).floor() as i32 - origin_y).clamp(0, last_y);
            let max_cy = (((ay + query) / CELL).floor() as i32 - origin_y).clamp(0, last_y);
            let min_cz = (((az - query) / CELL).floor() as i32 - origin_z).clamp(0, last_z);
            let max_cz = (((az + query) / CELL).floor() as i32 - origin_z).clamp(0, last_z);
            let r2 = query * query;
            for cx in min_cx..=max_cx {
                for cy in min_cy..=max_cy {
                    for cz in min_cz..=max_cz {
                        let index = ((cx as usize * dim_y as usize) + cy as usize) * dim_z as usize
                            + cz as usize;
                        let mut cursor = self.head[index];
                        while cursor >= 0 {
                            let j = cursor as usize;
                            cursor = self.next[j];
                            if j <= i {
                                continue;
                            }
                            let dx = ax - positions[j * 3];
                            let dy = ay - positions[j * 3 + 1];
                            let dz = az - positions[j * 3 + 2];
                            let dist_sq = dx * dx + dy * dy + dz * dz;
                            if dist_sq > r2 || dist_sq < 1e-12 {
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
}

thread_local! {
    static GRID: RefCell<Grid> = RefCell::new(Grid::default());
}

/// Computes pairwise forces with the same logic as the TypeScript engine:
/// a packed grid, a per-instance adaptive query range, and a per-pair range
/// cull before each force evaluation. Buffers are reused across calls.
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
    GRID.with(|grid| {
        grid.borrow_mut().compute(
            positions,
            radii,
            charges,
            donors,
            acceptors,
            masses,
            max_radius,
            has_donor,
            has_acceptor,
            epsilon,
            lj_cutoff_scale,
            coulomb_strength,
            coulomb_cutoff,
            dielectric,
            hb_strength,
            hb_distance,
            cutoff,
            out_forces,
        );
    });
}

#[cfg(test)]
mod tests {
    use super::compute_forces;

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
    fn handles_negative_coordinates_and_growth() {
        let mut positions = Vec::new();
        for i in 0..200 {
            positions.push(-40.0 + (i % 10) as f64);
            positions.push(-40.0 + (i / 10) as f64);
            positions.push(-5.0);
        }
        let radii = vec![1.5; 200];
        let charges = vec![0.0; 200];
        let forces = run(&positions, &radii, &charges);
        assert_eq!(forces.len(), 600);
    }
}
