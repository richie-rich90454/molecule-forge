# Preset scenarios

Thirty-six scenarios ship in `src/presets/PresetCatalog.ts`. Each fixes a seed, a spawn list with counts, and condition overrides. Applying a preset clears the chamber, so scenes reproduce exactly.

| Preset | Contents | Conditions |
| --- | --- | --- |
| Primordial Soup | glycine, alanine, water, ammonia | 900 K, catalyst |
| Combustion Chamber | octane, oxygen | 750 K |
| Polymer Factory | styrene | 340 K, catalyst |
| Protein Folding | insulin, water | 300 K |
| Crystal Cave | salt, water | 260 K |
| Explosion Lab | nitroglycerin, TNT, RDX | 300 K |
| Neuron Synapse | dopamine, serotonin, water | 310 K |
| DNA Replication | DNA duplex, adenine, thymine, water | 330 K |
| Petri Dish | glucose, water, glycine | 310 K |
| Toxicology | hydrogen cyanide, heme, oxygen | 310 K |
| Nanotube Growth | armchair tubes, graphene, C60 | 1200 K |
| Chirality Mirror | cis and trans 2-butene | 298 K |
| Fullerene Formation | C60, C70, graphite | 1400 K |
| Graphene Exfoliation | graphite, graphene | 400 K |
| Hemoglobin Loading | heme, oxygen | 310 K |
| ATP Cycle | ATP, water | 310 K, catalyst |
| Kevlar Spinning | Kevlar | 320 K |
| Teflon Coating | PTFE | 300 K |
| Sarin Neutralization | sarin, water, salt | 298 K, pH 10 |
| Caffeine Extraction | caffeine, water, ethanol | 340 K, high polarity |
| Cryogenic Lab | nitrogen, oxygen, argon, water | 77 K, low viscosity |
| Acid Rain | sulfur dioxide, nitrogen dioxide, water, acids | 290 K, pH 3.5 |
| Photosynthesis | carbon dioxide, water, glucose, oxygen | 300 K, catalyst |
| Fermentation | glucose, ethanol, carbon dioxide | 310 K, pH 5 |
| Greenhouse Blanket | carbon dioxide, methane, water, nitrous oxide | 320 K, 1.2 bar |
| Ozone Depletion | ozone, chlorine, CFC-12, fluorine | 210 K, 0.4 bar |
| Photochemical Smog | nitrogen dioxide, ozone, formaldehyde, acetaldehyde | 330 K, high polarity |
| Rocket Propellant | nitrous oxide, hydrogen, hydrogen peroxide, oxygen | 500 K, 0.6 bar |
| Noble Gas Glow | helium, neon, argon, krypton, xenon | 260 K, 0.3 bar |
| Halogen Series | fluorine, chlorine, bromine, iodine, hydrogen | 300 K |
| Semiconductor Doping | silicon, gallium, arsenic, germanium, boron | 900 K, 0.8 bar |
| Heavy Metal Sludge | lead, mercury, cadmium, chromium, water | 290 K, pH 4, gravity |
| Actinide Ridge | uranium, plutonium, thorium, radium, protactinium | 600 K, 1.4 bar |
| Nucleotide Pool | adenine, guanine, cytosine, thymine, uracil, water | 310 K, pH 7.4 |
| Steroid Pathway | cholesterol, testosterone, estradiol, progesterone, cortisol | 310 K, catalyst |
| Essential Oils | limonene, menthol, camphor, eugenol, thymol | 300 K, low viscosity, low polarity |

## Elemental scenes react

The elemental scenes are not static. Semiconductor Doping, Halogen Series, Noble Gas Glow, Heavy Metal Sludge, and Actinide Ridge spawn loose atoms, so the synthesis engine starts forming compounds the moment two reactive elements touch: gallium and arsenic combine into GaAs, helium, neon, and argon stay inert (only xenon, krypton, and radon fluorides are reachable, and those scenes have no fluorine), and the heavy-metal scene keeps its cations dissolved until a nonmetal arrives. Add a halogen to a metal scene to see a salt crystallize out of the chamber.

## Snapshots

Any chamber state serializes into the address bar hash through `SnapshotCodec`: preset id, seed, slider values, and per-molecule spawn counts in a compact base64url string. Snapshot copies the full URL to the clipboard. Loading a URL with a hash restores the preset when present, otherwise respawns the recorded inventory with a capped count per molecule. Snapshot stores molecule ids and counts, not positions, so a restored elemental scene re-mixes and re-forms its compounds under the same seed.
