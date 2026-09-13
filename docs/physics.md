# Physics layer

All files live in `src/sim`. The physics engine knows molecules as rigid bodies, never as chemistry. The one chemistry-directed module in this folder, `SynthesisEngine`, is covered under [Reactions](/reactions); it reads the world but the forces here do not.

## Integration

`PhysicsEngine` runs kick-drift-kick leapfrog at a fixed 240 Hz timestep, fully decoupled from the render rate. Per step it rebuilds a `SpatialHashGrid`, loops neighbor pairs inside a 10 angstrom cutoff, accumulates strategy-pattern forces, adds Langevin thermal noise scaled by temperature plus radiation, applies gravity and viscous drag, integrates, bounces softly off the chamber walls, and advances orientations through damped angular velocity and quaternion integration.

Three guards keep long sessions alive: pairwise force magnitudes clamp at 4000, speeds clamp at 120 units per second, and any body whose state goes non-finite is parked safely at the origin instead of poisoning the scene. The renderer additionally skips non-finite instances, and the camera resets itself rather than rendering NaN.

## Forces

Each calculator implements `IForceCalculator.computeMagnitude` returning a signed scalar along the pair axis (positive repels):

- **Lennard-Jones** (`LennardJonesCalculator`, epsilon 2.2, 3 sigma cutoff): van der Waals attraction with Pauli repulsion. The well depth scales live with the bond-strength slider.
- **Coulomb** (`CoulombCalculator`, strength 60, 20 angstrom cutoff): charge interactions screened by a distance-dependent dielectric driven by the polarity slider.
- **Hydrogen bonds** (`HydrogenBondCalculator`, strength 3, 3.5 angstrom range): short-range attraction scaled by donor and acceptor counts from each molecule record.

## World and budget

`World` owns instances, parameters, the animated pressure piston (target box follows the pressure slider), and decaying spark and catalyst transients. It counts live atoms and refuses spawns beyond 200000 atoms or 2500 instances, so painting DNA duplexes cannot kill the tab. Reaction products respect the same budget.

## Determinism

`SeededRandom` (mulberry32) feeds spawn jitter, thermal kicks, detonation scatter, and reaction rolls. Presets fix their seed, so identical clicks reproduce identical scenes. The Rust core in `src/wasm/engine` mirrors the integrators, forces, grid, and rate math, compiles warning-free, and passes twelve unit tests; the TypeScript engine above is the current runtime path.
