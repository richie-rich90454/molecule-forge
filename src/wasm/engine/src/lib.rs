pub mod force_calculator;
pub mod reaction_rule;
pub mod spatial_hash;
pub mod world;

pub use force_calculator::{CoulombCalculator, ForceCalculator, HydrogenBondCalculator, LennardJonesCalculator};
pub use reaction_rule::{ReactionCondition, ReactionRule};
pub use spatial_hash::SpatialHashGrid;
pub use world::{MoleculeBody, World};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct EngineHandle {
    world: World,
}

#[wasm_bindgen]
impl EngineHandle {
    pub fn new() -> EngineHandle {
        EngineHandle { world: World::new() }
    }

    pub fn body_count(&self) -> usize {
        self.world.len()
    }

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
                    total += calc.magnitude(
                        dist,
                        (radii[i] + radii[j]) * 0.5,
                        charges[i],
                        charges[j],
                    );
                }
                total += hb.pair_magnitude(
                    dist,
                    donors[i] as u32 + donors[j] as u32,
                    acceptors[i] as u32 + acceptors[j] as u32,
                );
                if total > 4000.0 {
                    total = 4000.0;
                } else if total < -4000.0 {
                    total = -4000.0;
                }
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
