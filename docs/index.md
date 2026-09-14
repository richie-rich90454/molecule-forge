---
layout: home
hero:
    name: Molecule Forge
    text: A chemistry sandbox that runs on physics
    tagline: Spawn 507 real molecules. Place loose atoms and watch compounds form. Drag the temperature. Press Detonate. Everything runs from one HTML file with no backend and no typing.
    actions:
        - theme: brand
          text: Playing guide
          link: /guide
        - theme: alt
          text: How it works
          link: /architecture
features:
    - title: Real molecules only
      details: 507 records across 17 categories with true graphs, bond orders, formal charges, stereochemistry, and aromaticity. Every record passes valence, distance, formula, and mass validation before it ships.
    - title: Chemistry that actually bonds
      details: A valence and electronegativity model with common oxidation states for all 94 elements, a polyatomic ion set that generates oxyanions on demand, computed reaction enthalpies from bond energies and Born-Haber cycles, standard reduction potentials for metal displacement, and a Debye-Huckel solvent activity. Place cerium next to bromine and CeBr3 forms, add oxygen and hydrogen and NaOH forms, add sulfur and oxygen and Na2SO4 forms.
    - title: Physics at 240 Hz
      details: Rigid bodies with Lennard-Jones, screened Coulomb, and hydrogen-bond forces on a spatial hash grid. Cold scenes crystallize, hot scenes vaporize, nothing is scripted.
    - title: Scratch the surface, then ignite it
      details: Fourteen hand-authored reaction rules for combustion, polymerization, neutralization, and detonation, plus general combustion, halogenation, redox, synthesis, and pyrolysis engines for everything else.
    - title: Self-contained folder
      details: The production build is a complete dist folder - index.html, JavaScript, CSS, the WebAssembly force engine, and the bundled Noto fonts. Serve it from any static file server. No backend, no CDN.
    - title: Deterministic scenarios
      details: Thirty-seven seeded presets reproduce exactly. URL hashes encode the full universe, so the Share button copies a working link to any state.
    - title: Fast on real displays
      details: DPR-aware canvas up to 4.0, uncapped rendering with interpolated 240 Hz physics, a WebAssembly force engine, instanced draw calls, and adaptive quality that sheds load instead of frames.
---

## Quickstart

```bash
bun install
bun run dev       # develop with hot reload
bun run build     # produce the dist folder
bun run test      # run the Vitest suite (334 tests, 100 percent coverage)
bun run validate  # validate all 507 molecules
```

Serve the `dist` folder with any static file server (for example `caddy file-server --root dist`) and open it in a modern browser. Pick a molecule card, click the canvas to place it, drag sliders to change conditions, and press Spark. For the chemistry model, open the Elements tab and set two reactive atoms next to each other.
