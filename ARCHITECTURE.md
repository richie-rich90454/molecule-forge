# Architecture

Molecule Forge splits into three layers that meet at narrow interfaces: chemistry (what things are), physics (how things move), and computer science (how it all runs fast in one file).

## Chemistry layer (`src/chem`)

Molecules are data. Each record carries a heavy-atom graph with bond orders, formal charges, stereochemistry flags, and aromaticity marks. `MoleculeFactory` expands implicit hydrogens from valence rules, embeds 3D coordinates with CSD-derived bond lengths and ideal geometries, then relaxes the structure with bonded springs plus short-range repulsion. `MoleculeValidator` checks valences, bond lengths, atom separations, formula consistency, and mass. `SmilesParser` converts verified SMILES strings into graph records so complex drugs can be transcribed mechanically instead of by hand. Nothing in this layer knows about rendering or the DOM.

## Physics layer (`src/sim`)

Molecules are rigid bodies with position, velocity, orientation, and angular velocity. `PhysicsEngine` integrates with kick-drift-kick leapfrog at a fixed 240 Hz timestep. Forces are strategies behind `IForceCalculator`: Lennard-Jones for van der Waals, Coulomb with distance-dependent dielectric screening, and directional hydrogen bonding from donor and acceptor counts. A `SpatialHashGrid` keeps neighbor queries linear. Thermal noise scales with the temperature slider, so cold scenes crystallize and hot scenes vaporize. `ReactionEngine` matches reactant patterns near each other, checks temperature, pH, spark, and catalyst conditions, then swaps reactants for products with a flash, particles, sound, and a plain-English log line. All randomness flows from `SeededRandom`, so presets reproduce exactly.

## Rendering and app (`src/render`, `src/ui`)

Rendering is decoupled from physics. `FramePacer` accumulates real time, steps physics at 240 Hz, and renders uncapped through `requestAnimationFrame` with interpolated positions, so 60 Hz, 144 Hz, and 360 Hz displays each get smooth motion. Atoms render as one `InstancedMesh` per element and bonds as one per bond order. `QualityManager` sheds load in stages (halo glow, particle counts, bond stride, pixel ratio) when the frame budget slips, and recovers when headroom returns. The canvas is DPR-aware up to 4.0 through `ResizeObserver`, with all buffers sized in device pixels. UI state lives in class-based view models using SolidJS signals; components are thin.

## Single-file strategy

Vite builds with `base: "./"` and `vite-plugin-singlefile` inlines all JavaScript, CSS, and data into `dist/index.html`. Molecule data is statically imported, never fetched. The physics worker is constructed from a Blob URL, and worker messages use transferable buffers. There is no `SharedArrayBuffer`, no dynamic import, and no runtime network. The Rust core in `src/wasm/engine` mirrors the force and spatial-hash math and compiles to WebAssembly for future inlining; the TypeScript engine is the current runtime path.
