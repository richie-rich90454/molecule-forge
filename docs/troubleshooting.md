# Troubleshooting

## The tab slows down or stutters

Open the HUD readout at the top right of the canvas. If the quality level reads above zero, the adaptive manager is already shedding load. The usual causes are thousands of live molecules, a huge polymer or DNA spawn, or a weak integrated GPU. Clear the chamber, prefer smaller molecules, or lower pixel-heavy toggles like bloom and orbitals. The engine never caps your refresh rate; it degrades effects first.

## Spawning refuses with an atom budget message

The chamber holds 200000 atoms across 2500 molecules. DNA duplexes, insulin, and long polymers eat budget fast by design, since a single careless paint stroke could otherwise allocate millions of instances and kill the tab. Erase or clear to make room.

## A preset shows an empty chamber

Preset spawn lists respect the same budget, so on a nearly full chamber a preset may place only part of its inventory. Clear first, then apply the preset.

## Detonate does nothing visible

Detonation needs something burnable: explosive-tagged molecules for shockwaves, or a fuel plus an oxidizer (octane plus oxygen, ethene plus oxygen) for combustion. Detonate arms the spark flag and heats to at least 950 K; combustion rules still need their temperature thresholds and a few seconds of simulation. If the chamber is cold and fuel-free, the log tells you exactly what to add.

## Spark does nothing visible

Spark arms ignition and adds 150 K. Far below 700 K with no fuel nearby, there is nothing to catch. Heat first or spawn fuel plus oxygen, then spark.

## Sound stays silent

Sound ships off. Flip the Sound toggle, then trigger any action. Browsers require a user gesture before audio starts, so the first click resumes the context.

## A shared URL loads the wrong scene

Hashes encode preset id, seed, sliders, and spawn counts. Unknown molecule ids are skipped, per-molecule counts cap at 60, and malformed hashes fall back to the showcase scene. Copy fresh links with Snapshot after changing scenes.

## file:// quirks

Some hardened browser profiles disable WebGL or Blob workers on `file://`. The app detects both, logs a clear message, and degrades: physics continues on the main thread and rendering falls back gracefully. Serve over `bun run dev` or any static server for the full path.

## Display issues

The canvas targets device pixels up to DPR 4.0. If edges look soft, check browser zoom is at 100 percent and no OS-level scaling override is forcing bitmap stretching. Narrow screens under 900 px collapse the library to tabs and move the tool switcher above the controls.
