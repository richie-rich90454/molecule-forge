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
        Self {
            bodies: Vec::new(),
            next_id: 1,
            box_size: 60.0,
            time: 0.0,
        }
    }

    pub fn len(&self) -> usize {
        self.bodies.iter().filter(|b| b.alive).count()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn spawn(&mut self, x: f64, y: f64, z: f64, radius: f64, mass: f64) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        self.bodies
            .push(MoleculeBody::new(id, x, y, z, radius, mass));
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
            }
            body.velocity[1] += gravity * dt;
            for axis in 0..3 {
                body.position[axis] += body.velocity[axis] * dt;
            }
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

#[cfg(test)]
mod tests {
    use super::World;

    #[test]
    fn spawn_remove_and_len() {
        let mut world = World::new();
        assert_eq!(world.len(), 0);
        let id = world.spawn(0.0, 0.0, 0.0, 2.0, 16.0);
        assert_eq!(world.len(), 1);
        world.remove(id);
        assert_eq!(world.len(), 0);
    }

    #[test]
    fn integrate_moves_bodies() {
        let mut world = World::new();
        world.spawn(0.0, 0.0, 0.0, 2.0, 16.0);
        world.bodies[0].velocity = [10.0, 0.0, 0.0];
        world.integrate(0.1, 0.0, 1.0);
        assert!(world.bodies[0].position[0] > 0.9);
    }

    #[test]
    fn walls_confine_bodies() {
        let mut world = World::new();
        world.spawn(1000.0, 0.0, 0.0, 2.0, 16.0);
        world.integrate(0.1, 0.0, 1.0);
        assert!(world.bodies[0].position[0].abs() <= world.box_size * 0.5 + 1e-9);
    }
}
