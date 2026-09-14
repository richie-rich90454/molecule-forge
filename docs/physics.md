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

The inner loop is allocation-free, culls as much as the physics allows, and produces bit-identical results to a plain cutoff query:

- `SpatialHashGrid` stores live instances directly under a packed integer cell key, so a query never rebuilds a string key, never touches a second position map, and never does an id-to-instance lookup. A step inserts references and reuses one scratch array.
- Each calculator exposes `getRange(a, b)`, the exact distance beyond which its magnitude is zero. The engine computes the maximum range for a pair and skips the calculators entirely past it, so neutral, non-hydrogen-bonding pairs that fall outside the van der Waals range cost one distance check instead of three force evaluations. Charged pairs keep their full 20 angstrom Coulomb range, so screening is unchanged.
- The grid query itself uses a per-instance interaction radius instead of the flat 10 angstrom cutoff. Each step settles the scene's largest radius plus whether any donor and any acceptor exist, hands that synthetic partner to every calculator's `getRange`, and queries the grid with the maximum. A small molecule in a water-rich scene searches a ~4.5 angstrom neighborhood rather than 10; a charged molecule still searches the full cutoff. Because the radius is an upper bound derived from the calculators themselves, every pair with a nonzero force is still visited and the trajectory is unchanged, verified by an identical position checksum with and without the optimization. In a dense 2000-molecule mixed scene it removes 5.9% of the neighbor candidates, and 87.6% in a pure water scene.
- `World.getInstanceList()` returns a versioned cache, invalidated on spawn, remove, and clear, so the physics step, the reaction engines, and the renderer share one array instead of allocating per access.

The remaining cost is the O(n^2 / density) pairwise force integral itself. The WebAssembly backend (below) computes it two to three times faster than the JavaScript loop, and the frame loop additionally caps physics at 6 ms per frame: if the chamber cannot keep up, it drops the surplus fixed steps, so an overloaded scene runs in slow motion in simulation time rather than stalling the interface. Every step that does run is exact and deterministic.

## Determinism

`SeededRandom` (mulberry32) feeds spawn jitter, thermal kicks, detonation scatter, and reaction rolls. Presets fix their seed, so identical clicks reproduce identical scenes.

## Rust core (experimental)

## WebAssembly backend

The same optimized force loop is compiled to WebAssembly from the Rust crate in `src/wasm/engine`. `compute_forces` mirrors the TypeScript engine exactly: a packed spatial grid (one reused bucket-head array plus an intrusive list, so a pass allocates nothing), a per-instance adaptive query range derived from the calculators, a per-pair range cull, and the same Lennard-Jones, Coulomb, and hydrogen-bond terms with the same ±4000 clamp. Integration, thermal noise, drag, walls, angular wobble, and quaternion updates stay in TypeScript, so the seeded random stream is untouched and both backends produce identical trajectories (verified bit-for-bit over 400 steps). On typical chambers the wasm path is roughly two to three times faster than the JavaScript loop; the engine uses it from 16 molecules up and keeps the JavaScript loop below that, where the call overhead would dominate.

At startup the app checks `WebAssembly` support; when it is present and the module instantiates, the wasm backend becomes the default. The **Physics WASM / JS** button in the top bar switches between the two at any time and is disabled when WebAssembly is unavailable. The engine ships as a `dist/assets/*.wasm` file in the static build, so it stays offline. Rebuild it with `bun run wasm:build` and test the crate with `bun run wasm:test`.
