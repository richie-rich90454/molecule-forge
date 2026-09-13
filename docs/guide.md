# Playing guide

Molecule Forge has no text input anywhere. Everything happens through cards, tools, sliders, buttons, and direct canvas manipulation.

## Canvas tools

The toolbar floating over the canvas picks exactly one interaction mode, so clicks never do something surprising:

- **Orbit** (default): left-drag orbits, scroll zooms, middle-drag pans. Clicking an atom selects it; clicking a second atom attempts a bond, and the log reports whether valences allow it. Nothing spawns in this mode.
- **Place**: click spawns the selected molecule once; drag paints copies at 12 Hz. Picking any molecule card switches here automatically and names the button, for example Place Caffeine.
- **Erase**: click or drag removes molecules. Right-click removes in every mode.

## Library

The left panel holds seventeen category tabs, from alkanes to the elemental table, with a live rotating thumbnail per molecule. Cards show the name, formula, and a hazard badge for warning molecules. Warning molecules cannot spawn while the Warnings toggle is off.

## Forming compounds

Open the **Elements** tab, then place loose atoms next to each other and watch real bonding:

- Place a metal and a nonmetal close together and an ionic compound forms. Cerium plus three bromine atoms becomes CeBr3, cerium(III) bromide. Iron plus oxygen becomes Fe2O3, iron(III) oxide.
- Add oxygen and hydrogen and you get the polyatomic salts: sodium plus oxygen plus hydrogen is NaOH, sodium hydroxide; potassium plus nitrogen plus three oxygens is KNO3, potassium nitrate; calcium plus carbon plus three oxygens is CaCO3, calcium carbonate; two ammoniums plus a sulfate gives (NH4)2SO4, ammonium sulfate.
- Two atoms of a diatomic former combine on contact: oxygen into O2, hydrogen into H2, iodine into I2. Eight sulfurs close into an S8 ring and four phosphorus atoms form the P4 tetrahedron.
- Place a carbon, two oxygens, and hydrogen together to build carbon dioxide and water.

Atoms are conserved. If the local cluster has the wrong ratio, nothing is invented and the log tells you the limiting element, for example "Cerium(III) bromide needs 1 Ce and 3 Br per unit. Add more Br." Ionic salts and radical recombination happen on contact; molecular compounds like water and methane want about 250 K of heat, so a frozen chamber stays still until you warm it. The product appears as a new molecule instance you can inspect, drag, and react further. Synthesis runs on the same fixed-step clock as everything else, so heating a scene speeds it up.

## Sliders

Nine sliders drive the simulation live:

| Slider | Range        | Effect                                         |
| ------ | ------------ | ---------------------------------------------- |
| Temp   | 0 to 1500 K  | Thermal noise, reaction rates, phase behavior  |
| Press  | 0.2 to 5 bar | Animates the chamber piston, squeezing the box |
| pH     | 0 to 14      | Gates pH-sensitive reaction rules              |
| Visc   | 0 to 1       | Drag on every molecule                         |
| Polar  | 0 to 1       | Dielectric screening of charges                |
| Grav   | -1 to 2      | Downward pull, reversible                      |
| Speed  | 0.1 to 3     | Simulation time scale                          |
| Bonds  | 0.2 to 2     | Lennard-Jones well depth multiplier            |
| Rad    | 0 to 1       | Extra thermal agitation from radiation         |

## Actions

Heat, Cool, Freeze, and Shake set conditions fast. Spark arms ignition and warms the gas. Detonate fires explosive charges and, crucially, heats fuel air mixes to ignition so octane plus oxygen actually burns. Catalyze lowers activation barriers for a while. Polymerize converts loose monomers into chains. Snapshot copies a shareable URL. Clear empties the chamber.

## Toggles

Bonds, Charges, Orbitals, Arrows, Grid, Graph, Slow motion, Bloom, Sound (off by default), and Warnings each switch one visual or audio layer. Graph mode renders wireframe shells that expose the underlying molecular graphs. The spatial grid toggle draws the neighbor-search lattice the physics engine uses. Charges draws the glow on formal ions, which makes fresh ionic compounds easy to spot.

## Presets and seeds

Thirty-six scenarios ship with fixed seeds, so Combustion Chamber today is Combustion Chamber tomorrow. The seed button rerolls the seed used by paint jitter, detonation scatter, synthesis jitter, and reaction rolls. Every preset writes its state into the address bar hash.

## Atom budget

The chamber holds at most 2500 molecules and 200000 atoms. Giant structures like DNA duplexes and insulin consume budget fast. When the budget fills, spawning refuses with a log line instead of crashing the tab. Clear or erase to make room. Synthesis respects the same budget: it will not consume reactants if the products would overflow the chamber.
