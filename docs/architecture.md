# Architecture

Three layers meet at narrow interfaces: chemistry (what things are and what they become), physics (how things move), and rendering plus UI (how it looks and responds).

## Chemistry (`src/chem`)

Data in, records out. `MoleculeCatalog` holds compact graph specs and builders for all 507 catalogue molecules. `SmilesParser` transcribes verified SMILES. `MoleculeFactory` expands hydrogens, embeds 3D coordinates, and relaxes. `MoleculeValidator` enforces seven checks. `MoleculeRegistry` indexes the catalogue lazily: construction costs only the compact specs, and each record is built and cached on first request, so startup never pays for the whole library. `ElementRegistry` covers hydrogen through plutonium with radii, colours, and bond lengths; `ElementChemistry` adds electronegativity, element kind, and common oxidation states. `CompoundSynthesizer` uses that data to predict and build compounds that are not in the catalogue, generating formula, Stock name, charges, and geometry on demand. Nothing here touches the DOM, workers, or WebGL.

## Simulation (`src/sim`)

`World` owns instances and parameters. `PhysicsEngine` integrates rigid bodies at 240 Hz behind `IForceCalculator` strategies, accelerated by `SpatialHashGrid`. `ReactionEngine` matches `ReactionCatalog` rules against nearby molecules. `SynthesisEngine` gathers loose elemental atoms within 7 angstroms and calls `CompoundSynthesizer` to form compounds, consuming exactly the atoms a balanced formula needs and returning any overshoot as free atoms. `SeededRandom` makes every stochastic choice reproducible. `SimulationWorker` builds a Blob-URL worker that computes Lennard-Jones plus Coulomb force buffers off the main thread with transferable array buffers.

## Rendering (`src/render`)

`FramePacer` accumulates wall time and emits fixed physics steps with an interpolation alpha. `Renderer` owns the three.js scene, DPR-aware sizing through `ResizeObserver` (device pixels, capped at 4.0), and per-frame buffer builds that rotate local coordinates by instance quaternions with thermal jitter. Pick and unproject calls refresh the camera world matrix and guard zero-sized canvases. Atoms draw as one `InstancedMesh` per element with an additive halo shell; bonds draw as instanced cylinders grouped by order, with doubled and tripled offsets. `EffectRenderer` pools flashes, spark particles, motion trails, reaction arrows, and the debug grid. `CameraController` implements orbit, pan, and zoom without dependencies and can disengage navigation while paint tools are active. `QualityManager` watches the frame budget over one-second windows and sheds halo glow, particles, bond density, then pixel ratio, recovering when headroom returns.

## Interface (`src/ui`, `src/presets`, `src/audio`, `src/state`)

`AppViewModel` holds every SolidJS signal (library selection, nine sliders, ten toggles, canvas tool, log, playback, seed, HUD) plus all actions, and implements the reaction sink that turns engine events into flashes, sounds, and log lines. Views are thin components: tabs, cards with live 2D thumbnails, sliders, actions, toggles, presets, tool switcher, and a collapsible log. `Application` wires everything, owns the fixed-step loop with time scaling, runs the rule and synthesis engines every twelfth step, routes pointer input by active tool, and restores URL snapshots on load. `SoundEngine` synthesizes all audio with WebAudio, off by default.

## Single-file strategy

Vite builds with `base: "./"` and `vite-plugin-singlefile` inlines JavaScript, CSS, and data into one `dist/index.html`. Molecule data is statically imported, never fetched. No dynamic imports, no `SharedArrayBuffer`, no runtime network. The Rust core mirrors the hot math and compiles warning-free with twelve unit tests; TypeScript is the current runtime path.
