# Rendering

## Frame pacing

`requestAnimationFrame` drives rendering with no assumptions about refresh rate. Each frame, `FramePacer` clamps the wall delta to 0.1 seconds (so background tabs never cause a death spiral), accumulates time, and emits up to ten fixed 240 Hz physics steps. The leftover fraction becomes the interpolation alpha: every rendered position lerps between the previous and current physics state, so motion stays smooth at 60, 144, and 360 Hz alike. A time-scale multiplier converts wall steps into simulation steps for slow motion and fast forward.

## High DPI

The canvas backing store is CSS size times `devicePixelRatio`, capped at 4.0, resized through `ResizeObserver` on the container rather than window events. Thumbnails render at up to 2x on a 15 fps budget, and only visible cards redraw. Degradation steps drop the cap to 2.0, 1.5, 1.25, then 1.0 only when the frame budget demands it.

## Draw calls

Atoms cost one draw call per element present, bonds one per bond-order bucket, plus halo, flashes, particles, trails, and arrows. A 2000-molecule scene is a few dozen draw calls total. Bond stride halves bond instances under load before pixel ratio is touched.

## Interaction model

A three-way tool switch removes all click ambiguity. Orbit mode navigates and inspects atoms. Place mode disengages camera drag so painting never orbits by accident. Erase mode deletes on click or drag. Wheel zoom and middle-drag pan stay live in every mode. Atom picking projects world positions to screen space and takes the nearest candidate within a pixel threshold, which stays exact at any DPI.

## Typography

The interface uses two families only, `Noto Sans` for text and `Noto Sans Mono` for numeric readouts and the log. Both ship with the build as `dist/assets/*.woff2` files (no web font is requested at runtime), and the CSS lists the generic `sans-serif` and `monospace` families as fallbacks.

## Budgets

Frame budget is 16.7 ms at 60 fps down to 2.78 ms at 360 fps. If the one-second average exceeds 12 ms, quality steps down once per second; it steps back up after four calm seconds. The HUD reports fps, live count, and quality level so tuning is visible.
