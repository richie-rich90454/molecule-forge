pub struct ReactionCondition {
    pub temp_min: Option<f64>,
    pub temp_max: Option<f64>,
    pub needs_spark: bool,
    pub needs_catalyst: bool,
}

impl ReactionCondition {
    pub fn new() -> Self {
        Self { temp_min: None, temp_max: None, needs_spark: false, needs_catalyst: false }
    }

    pub fn with_hot(min: f64) -> Self {
        Self { temp_min: Some(min), temp_max: None, needs_spark: false, needs_catalyst: false }
    }

    pub fn is_met(&self, temperature: f64, spark: f64, catalyst: f64) -> bool {
        if let Some(min) = self.temp_min {
            if temperature < min {
                return false;
            }
        }
        if let Some(max) = self.temp_max {
            if temperature > max {
                return false;
            }
        }
        if self.needs_spark && spark <= 0.05 && temperature < 600.0 {
            return false;
        }
        if self.needs_catalyst && catalyst <= 0.05 {
            return false;
        }
        true
    }
}

impl Default for ReactionCondition {
    fn default() -> Self {
        Self::new()
    }
}

pub struct ReactionRule {
    pub id: String,
    pub activation_energy: f64,
    pub delta_h: f64,
}

impl ReactionRule {
    pub fn new(id: &str, activation_energy: f64, delta_h: f64) -> Self {
        Self { id: id.to_string(), activation_energy, delta_h }
    }

    pub fn rate(&self, temperature: f64, boost: f64) -> f64 {
        let raw = (-self.activation_energy / (0.008314 * temperature.max(50.0))).exp();
        (raw * boost * 8.0).min(0.5)
    }
}

#[cfg(test)]
mod tests {
    use super::{ReactionCondition, ReactionRule};

    #[test]
    fn gates_on_temperature_and_catalyst() {
        let cond = ReactionCondition::with_hot(700.0);
        assert!(!cond.is_met(100.0, 0.0, 0.0));
        assert!(cond.is_met(900.0, 0.0, 0.0));
        let mut spark_only = ReactionCondition::new();
        spark_only.needs_spark = true;
        assert!(!spark_only.is_met(298.0, 0.0, 0.0));
        assert!(spark_only.is_met(298.0, 1.0, 0.0));
    }

    #[test]
    fn rate_stays_bounded() {
        let rule = ReactionRule::new("combustion-methane", 45.0, -890.0);
        let rate = rule.rate(900.0, 1.0);
        assert!(rate > 0.0 && rate <= 0.5);
        assert_eq!(rule.rate(50.0, 0.0), 0.0);
    }
}
