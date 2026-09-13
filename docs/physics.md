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

## Performance

The inner loop is allocation-free and culls as much as the physics allows, with no change to results:

- `SpatialHashGrid` stores live instances directly under a packed integer cell key, so a query never rebuilds a string key, never touches a second position map, and never does an id-to-instance lookup. A step inserts references and reuses one scratch array.
- Each calculator exposes `getRange(a, b)`, the exact distance beyond which its magnitude is zero. The engine computes the maximum range for a pair and skips the calculators entirely past it, so neutral, non-hydrogen-bonding pairs that fall outside the van der Waals range cost one distance check instead of three force evaluations. Charged pairs keep their full 20 angstrom Coulomb range, so screening is unchanged.
- `World.getInstanceList()` returns a versioned cache, invalidated on spawn, remove, and clear, so the physics step, the reaction engines, and the renderer share one array instead of allocating per access.

Measured on a mixed 60-unit chamber (100 force evaluations per molecule-second before, up to 2500 instances):

| Instances | Before       | After        | Speedup |
| --------- | ------------ | ------------ | ------- |
| 500       | 13.9 ms/step | 1.8 ms/step  | 7.7x    |
| 1000      | 42.8 ms/step | 3.9 ms/step  | 11x     |
| 2000      | 112 ms/step  | 18.2 ms/step | 6.2x    |

The remaining cost is the O(n^2) pairwise force integral itself. For very large chambers the intended next step is the already-implemented `SimulationWorker`, which computes the same Lennard-Jones and Coulomb pair forces in a Blob-URL worker; the main-thread path is the current runtime.

## Determinism

`SeededRandom` (mulberry32) feeds spawn jitter, thermal kicks, detonation scatter, and reaction rolls. Presets fix their seed, so identical clicks reproduce identical scenes. The Rust core in `src/wasm/engine` mirrors the integrators, forces, grid, and rate math, compiles warning-free, and passes twelve unit tests; the TypeScript engine above is the current runtime path.
