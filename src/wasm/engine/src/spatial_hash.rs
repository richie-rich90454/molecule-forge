use std::collections::HashMap;

pub struct SpatialHashGrid {
    cell_size: f64,
    cells: HashMap<(i64, i64, i64), Vec<usize>>,
    positions: HashMap<usize, (f64, f64, f64)>,
}

impl SpatialHashGrid {
    pub fn new(cell_size: f64) -> Self {
        Self { cell_size, cells: HashMap::new(), positions: HashMap::new() }
    }

    pub fn clear(&mut self) {
        self.cells.clear();
        self.positions.clear();
    }

    pub fn insert(&mut self, id: usize, x: f64, y: f64, z: f64) {
        let key = self.key_for(x, y, z);
        self.cells.entry(key).or_insert_with(Vec::new).push(id);
        self.positions.insert(id, (x, y, z));
    }

    pub fn query_radius(&self, x: f64, y: f64, z: f64, radius: f64, out: &mut Vec<usize>) {
        out.clear();
        if radius <= 0.0 {
            return;
        }
        let min_x = ((x - radius) / self.cell_size).floor() as i64;
        let max_x = ((x + radius) / self.cell_size).floor() as i64;
        let min_y = ((y - radius) / self.cell_size).floor() as i64;
        let max_y = ((y + radius) / self.cell_size).floor() as i64;
        let min_z = ((z - radius) / self.cell_size).floor() as i64;
        let max_z = ((z + radius) / self.cell_size).floor() as i64;
        let r2 = radius * radius;
        for cx in min_x..=max_x {
            for cy in min_y..=max_y {
                for cz in min_z..=max_z {
                    if let Some(list) = self.cells.get(&(cx, cy, cz)) {
                        for id in list.iter() {
                            if let Some((px, py, pz)) = self.positions.get(id) {
                                let dx = px - x;
                                let dy = py - y;
                                let dz = pz - z;
                                if dx * dx + dy * dy + dz * dz <= r2 {
                                    out.push(*id);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn cell_count(&self) -> usize {
        self.cells.len()
    }

    fn key_for(&self, x: f64, y: f64, z: f64) -> (i64, i64, i64) {
        (
            (x / self.cell_size).floor() as i64,
            (y / self.cell_size).floor() as i64,
            (z / self.cell_size).floor() as i64,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::SpatialHashGrid;

    #[test]
    fn finds_neighbors_within_radius() {
        let mut grid = SpatialHashGrid::new(6.0);
        grid.insert(1, 0.0, 0.0, 0.0);
        grid.insert(2, 3.0, 0.0, 0.0);
        grid.insert(3, 50.0, 0.0, 0.0);
        let mut out = Vec::new();
        grid.query_radius(0.0, 0.0, 0.0, 10.0, &mut out);
        assert!(out.contains(&1));
        assert!(out.contains(&2));
        assert!(!out.contains(&3));
    }

    #[test]
    fn clears_entries() {
        let mut grid = SpatialHashGrid::new(6.0);
        grid.insert(1, 0.0, 0.0, 0.0);
        grid.clear();
        let mut out = Vec::new();
        grid.query_radius(0.0, 0.0, 0.0, 10.0, &mut out);
        assert!(out.is_empty());
        assert_eq!(grid.cell_count(), 0);
    }

    #[test]
    fn rejects_non_positive_radius() {
        let mut grid = SpatialHashGrid::new(6.0);
        grid.insert(1, 0.0, 0.0, 0.0);
        let mut out = Vec::new();
        grid.query_radius(0.0, 0.0, 0.0, 0.0, &mut out);
        assert!(out.is_empty());
    }
}
