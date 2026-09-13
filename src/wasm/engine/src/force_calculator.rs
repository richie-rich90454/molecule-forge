pub trait ForceCalculator {
    fn name(&self) -> &'static str;
    fn magnitude(&self, dist: f64, sigma: f64, charge_a: f64, charge_b: f64) -> f64;
}

pub struct LennardJonesCalculator {
    epsilon: f64,
}

impl LennardJonesCalculator {
    pub fn new(epsilon: f64) -> Self {
        Self { epsilon }
    }
}

impl ForceCalculator for LennardJonesCalculator {
    fn name(&self) -> &'static str {
        "LennardJones"
    }

    fn magnitude(&self, dist: f64, sigma: f64, _charge_a: f64, _charge_b: f64) -> f64 {
        if sigma <= 0.0 || dist <= 1e-6 || dist > sigma * 3.0 {
            return 0.0;
        }
        let s_over_r = sigma / dist;
        let s6 = s_over_r.powi(6);
        let s12 = s6 * s6;
        24.0 * self.epsilon * (2.0 * s12 - s6) / dist
    }
}

pub struct CoulombCalculator {
    dielectric: f64,
}

impl CoulombCalculator {
    pub fn new(dielectric: f64) -> Self {
        Self { dielectric }
    }
}

impl ForceCalculator for CoulombCalculator {
    fn name(&self) -> &'static str {
        "Coulomb"
    }

    fn magnitude(&self, dist: f64, _sigma: f64, charge_a: f64, charge_b: f64) -> f64 {
        if charge_a == 0.0 || charge_b == 0.0 || dist <= 1e-6 {
            return 0.0;
        }
        charge_a * charge_b / (self.dielectric * dist * dist)
    }
}

pub struct HydrogenBondCalculator {
    strength: f64,
    max_distance: f64,
}

impl HydrogenBondCalculator {
    pub fn new(strength: f64, max_distance: f64) -> Self {
        Self { strength, max_distance }
    }

    pub fn pair_magnitude(&self, dist: f64, donors: u32, acceptors: u32) -> f64 {
        if donors == 0 || acceptors == 0 || dist <= 1e-6 || dist > self.max_distance {
            return 0.0;
        }
        let pairs = donors.min(acceptors) as f64;
        let falloff = 1.0 - dist / self.max_distance;
        -self.strength * pairs * falloff * falloff / dist
    }
}

impl ForceCalculator for HydrogenBondCalculator {
    fn name(&self) -> &'static str {
        "HydrogenBond"
    }

    fn magnitude(&self, _dist: f64, _sigma: f64, _charge_a: f64, _charge_b: f64) -> f64 {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::{CoulombCalculator, ForceCalculator, HydrogenBondCalculator, LennardJonesCalculator};

    #[test]
    fn lennard_jones_repels_up_close() {
        let calc = LennardJonesCalculator::new(2.2);
        assert!(calc.magnitude(1.0, 2.0, 0.0, 0.0) > 0.0);
    }

    #[test]
    fn lennard_jones_attracts_at_range() {
        let calc = LennardJonesCalculator::new(2.2);
        assert!(calc.magnitude(3.0, 2.0, 0.0, 0.0) < 0.0);
    }

    #[test]
    fn coulomb_repels_like_charges() {
        let calc = CoulombCalculator::new(20.0);
        assert!(calc.magnitude(5.0, 2.0, 1.0, 1.0) > 0.0);
        assert!(calc.magnitude(5.0, 2.0, 1.0, -1.0) < 0.0);
    }

    #[test]
    fn hydrogen_bond_attracts_donor_acceptor_pairs() {
        let calc = HydrogenBondCalculator::new(3.0, 3.5);
        assert!(calc.pair_magnitude(2.8, 1, 1) < 0.0);
        assert_eq!(calc.pair_magnitude(9.0, 1, 1), 0.0);
        assert_eq!(calc.pair_magnitude(2.8, 0, 1), 0.0);
    }
}
