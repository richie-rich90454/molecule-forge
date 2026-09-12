# Molecule Forge

A fully self-contained chemistry sandbox. Spawn real molecules, change conditions, and watch reactions unfold on a cinematic high-DPI canvas. No typing, no backend, no build step at runtime.

## Run it

```bash
bun run dev      # develop with hot reload
bun run build    # produce dist/index.html
bun run test     # run the Vitest suite
bun run validate # validate all 389 molecules
bun run bake > MOLECULES.md  # regenerate the molecule catalog listing
```

## Open it

Double-click `dist/index.html`. That is the entire application: one file, no server, no network. It also runs from any static host.

## Play

- Click a molecule card, then click the canvas to place it. Drag to paint at 12 Hz. Right-click a molecule to remove it.
- Drag sliders for temperature, pressure, pH, viscosity, polarity, gravity, speed, bond strength, and radiation.
- Pick a preset for an instant scenario. Press Heat, Spark, Detonate, Catalyze, and the rest.
- Drag to orbit, scroll to zoom, middle-drag to pan.

See `ARCHITECTURE.md` for the physics, chemistry, and rendering design. See `VALIDATION.md` for how molecule accuracy is checked. See `CONTRIBUTING.md` to add molecules or reactions.
