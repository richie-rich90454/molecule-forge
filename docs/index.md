---
layout: home
hero:
    name: Molecule Forge
    text: A chemistry sandbox that runs on physics
    tagline: Spawn 400 real molecules. Drag the temperature. Press Detonate. Everything runs from one HTML file with no backend and no typing.
    actions:
        - theme: brand
          text: Playing guide
          link: /guide
        - theme: alt
          text: How it works
          link: /architecture
features:
    - title: Real molecules only
      details: 406 records with true graphs, bond orders, formal charges, stereochemistry, and aromaticity. Every record passes valence, distance, formula, and mass validation before it ships.
    - title: Physics at 240 Hz
      details: Rigid bodies with Lennard-Jones, screened Coulomb, and hydrogen-bond forces on a spatial hash grid. Cold scenes crystallize, hot scenes vaporize, nothing is scripted.
    - title: Chemistry that fires
      details: Fifteen reaction rules with activation energies, conditions, stoichiometry, flashes, particles, synth sound, and plain-English narration in the reaction log.
    - title: One file, anywhere
      details: The production build is a single dist/index.html. Double-click it, or host it on any static server. No fetch of local assets, no SharedArrayBuffer, no backend.
    - title: Deterministic scenarios
      details: Twenty seeded presets reproduce exactly. URL hashes encode the full universe, so the Share button copies a working link to any state.
    - title: Fast on real displays
      details: DPR-aware canvas up to 4.0, uncapped rendering with interpolated 240 Hz physics, instanced draw calls, and adaptive quality that sheds load instead of frames.
---

## Quickstart

```bash
bun install
bun run dev       # develop with hot reload
bun run build     # produce dist/index.html
bun run test      # run the Vitest suite
bun run validate  # validate all 406 molecules
```

Open `dist/index.html` directly in any modern browser. Pick a molecule card, click the canvas to place it, drag sliders to change conditions, and press Spark.
