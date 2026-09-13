# Preset scenarios

Twenty scenarios ship in `src/presets/PresetCatalog.ts`. Each fixes a seed, a spawn list with counts, and condition overrides. Applying a preset clears the chamber, so scenes reproduce exactly.

| Preset               | Contents                            | Conditions           |
| -------------------- | ----------------------------------- | -------------------- |
| Primordial Soup      | glycine, alanine, water, ammonia    | 900 K, catalyst      |
| Combustion Chamber   | octane, oxygen                      | 750 K                |
| Polymer Factory      | styrene                             | 340 K, catalyst      |
| Protein Folding      | insulin, water                      | 300 K                |
| Crystal Cave         | salt, water                         | 260 K                |
| Explosion Lab        | nitroglycerin, TNT, RDX             | 300 K                |
| Neuron Synapse       | dopamine, serotonin, water          | 310 K                |
| DNA Replication      | DNA duplex, adenine, thymine, water | 330 K                |
| Petri Dish           | glucose, water, glycine             | 310 K                |
| Toxicology           | hydrogen cyanide, heme, oxygen      | 310 K                |
| Nanotube Growth      | armchair tubes, graphene, C60       | 1200 K               |
| Chirality Mirror     | cis and trans 2-butene              | 298 K                |
| Fullerene Formation  | C60, C70, graphite                  | 1400 K               |
| Graphene Exfoliation | graphite, graphene                  | 400 K                |
| Hemoglobin Loading   | heme, oxygen                        | 310 K                |
| ATP Cycle            | ATP, water                          | 310 K, catalyst      |
| Kevlar Spinning      | Kevlar                              | 320 K                |
| Teflon Coating       | PTFE                                | 300 K                |
| Sarin Neutralization | sarin, water, salt                  | 298 K, pH 10         |
| Caffeine Extraction  | caffeine, water, ethanol            | 340 K, high polarity |

## Snapshots

Any chamber state serializes into the address bar hash through `SnapshotCodec`: preset id, seed, slider values, and per-molecule spawn counts in a compact base64url string. Snapshot copies the full URL to the clipboard. Loading a URL with a hash restores the preset when present, otherwise respawns the recorded inventory with a capped count per molecule.
