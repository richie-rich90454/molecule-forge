pub struct MoleculeBody {
    pub id: usize,
    pub position: [f64; 3],
    pub velocity: [f64; 3],
    pub accel: [f64; 3],
    pub radius: f64,
    pub mass: f64,
    pub charge: f64,
    pub alive: bool,
}

impl MoleculeBody {
    pub fn new(id: usize, x: f64, y: f64, z: f64, radius: f64, mass: f64) -> Self {
        Self {
            id,
            position: [x, y, z],
            velocity: [0.0, 0.0, 0.0],
            accel: [0.0, 0.0, 0.0],
            radius,
            mass,
            charge: 0.0,
            alive: true,
        }
    }
}

pub struct World {
    bodies: Vec<MoleculeBody>,
    next_id: usize,
    pub box_size: f64,
    pub time: f64,
}

impl World {
    pub fn new() -> Self {
        Self { bodies: Vec::new(), next_id: 1, box_size: 60.0, time: 0.0 }
    }

    pub fn len(&self) -> usize {
        self.bodies.iter().filter(|b| b.alive).count()
    }

    pub fn spawn(&mut self, x: f64, y: f64, z: f64, radius: f64, mass: f64) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        self.bodies.push(MoleculeBody::new(id, x, y, z, radius, mass));
        id
    }

    pub fn remove(&mut self, id: usize) {
        if let Some(body) = self.bodies.iter_mut().find(|b| b.id == id) {
            body.alive = false;
        }
    }

    pub fn integrate(&mut self, dt: f64, gravity: f64, drag: f64) {
        let half = self.box_size * 0.5;
        for body in self.bodies.iter_mut().filter(|b| b.alive) {
            for axis in 0..3 {
                body.velocity[axis] = (body.velocity[axis] + body.accel[axis] * dt) * drag;
                body.position[axis] += body.velocity[axis] * dt;
            }
            body.velocity[1] += gravity * dt;
            for axis in 0..3 {
                if body.position[axis] > half {
                    body.position[axis] = half;
                    body.velocity[axis] = -body.velocity[axis].abs() * 0.6;
                } else if body.position[axis] < -half {
                    body.position[axis] = -half;
                    body.velocity[axis] = body.velocity[axis].abs() * 0.6;
                }
            }
            body.accel = [0.0, 0.0, 0.0];
        }
        self.time += dt;
    }
}

impl Default for World {
    fn default() -> Self {
        Self::new()
    }
}
