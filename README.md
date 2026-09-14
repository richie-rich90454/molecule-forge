# Molecule Forge

An offline chemistry sandbox that runs on real physics. Spawn **2,703 real molecules across 28 categories**, drop loose atoms and watch compounds form, drag the temperature, add a spark, and press Detonate. There is no backend and no sign-in.

## What it is

- **Real molecules only.** Every record is a true graph (bond orders, formal charges, stereochemistry, aromaticity) with 3D coordinates embedded from CSD-derived bond lengths. Records live as JSON, one file per category, under `src/chem/data`.
- **Chemistry that actually bonds.** A valence and electronegativity model with oxidation states for H to Pu, a polyatomic-ion set that generates oxyanions on demand, reaction enthalpies from bond energies and Born-Haber cycles, reduction potentials for metal displacement, and a Debye-Huckel activity correction.
- **Physics at 240 Hz.** Rigid bodies with Lennard-Jones, screened Coulomb, and hydrogen-bond forces on a spatial hash grid. Cold scenes crystallize, hot scenes vaporize, nothing is scripted.
- **Fast and correct.** A Rust/WebAssembly force engine is bit-identical to the TypeScript one and runs two to three times faster. A frame physics budget keeps the interface smooth on any scene, and the library loads in time-sliced batches.

## Stack

Bun, Vite, SolidJS, TypeScript, Rust/WebAssembly (wasm-bindgen). Vitest for tests, VitePress for this documentation. No runtime dependencies beyond the UI layer.

## Commands

```bash
bun install
bun run dev          # develop with hot reload
bun run build        # produce the dist folder (self-contained static site)
bun run test         # Vitest suite (100% coverage)
bun run validate     # validate every molecule in the library
bun run wasm:build   # rebuild the WebAssembly force engine
bun run wasm:test    # run the Rust unit tests
bun run docs:dev     # preview the documentation site
```

Serve `dist/` with any static file server (Caddy, `bunx serve`, and so on). Everything, including fonts and the WebAssembly engine, is bundled: no CDN, no network calls.

## Project layout

```
src/chem      molecules, elements, validation, thermochemistry, synthesis
src/chem/data per-category JSON molecule library (schema.json)
src/sim       physics, spatial grid, reaction and synthesis engines
src/render    WebGL renderer, quality manager, frame pacer
src/ui        SolidJS views and the view model
src/wasm      Rust force engine and its loader
docs          VitePress documentation
```

## Author

Richie Rich ([richie-rich90454](https://github.com/richie-rich90454))

## License

MIT
