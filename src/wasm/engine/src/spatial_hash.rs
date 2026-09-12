use std::collections::HashMap;

pub struct SpatialHashGrid {
    cell_size: f64,
    cells: HashMap<(i64, i64, i64), Vec<usize>>,
}

impl SpatialHashGrid {
    pub fn new(cell_size: f64) -> Self {
        Self { cell_size, cells: HashMap::new() }
    }

    pub fn clear(&mut self) {
        self.cells.clear();
    }

    pub fn insert(&mut self, id: usize, x: f64, y: f64, z: f64) {
        let key = self.key_for(x, y, z);
        self.cells.entry(key).or_insert_with(Vec::new).push(id);
    }

    pub fn query_radius(&self, x: f64, y: f64, z: f64, radius: f64, out: &mut Vec<usize>) {
        out.clear();
        let min_x = ((x - radius) / self.cell_size).floor() as i64;
        let max_x = ((x + radius) / self.cell_size).floor() as i64;
        let min_y = ((y - radius) / self.cell_size).floor() as i64;
        let max_y = ((y + radius) / self.cell_size).floor() as i64;
        let min_z = ((z - radius) / self.cell_size).floor() as i64;
        let max_z = ((z + radius) / self.cell_size).floor() as i64;
        for cx in min_x..=max_x {
            for cy in min_y..=max_y {
                for cz in min_z..=max_z {
                    if let Some(list) = self.cells.get(&(cx, cy, cz)) {
                        out.extend(list.iter().copied());
                    }
                }
            }
        }
    }

    fn key_for(&self, x: f64, y: f64, z: f64) -> (i64, i64, i64) {
        (
            (x / self.cell_size).floor() as i64,
            (y / self.cell_size).floor() as i64,
            (z / self.cell_size).floor() as i64,
        )
    }
}
