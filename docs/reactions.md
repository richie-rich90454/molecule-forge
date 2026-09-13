# Reaction rules

Fifteen rules ship in `src/sim/ReactionCatalog.ts`. `ReactionEngine` scans them at 20 Hz: it picks an anchor molecule matching the first reactant, gathers the remaining partners within 7 angstroms, checks temperature, pH, spark, and catalyst conditions, then rolls an Arrhenius probability `min(0.5, exp(-Ea / RT) * boost * 8)` against the seeded RNG. On success it removes reactants, spawns products at the centroid, and publishes a visual plus a log line. Every reactant and product id must exist in the catalog.

## Combustion

| Rule               | Reaction                                           | Needs |
| ------------------ | -------------------------------------------------- | ----- |
| combustion-methane | CH4 + 2 O2 into CO2 + 2 H2O, deltaH -890           | 700 K |
| combustion-ethene  | C2H4 + 3 O2 into 2 CO2 + 2 H2O, deltaH -1411       | 700 K |
| combustion-benzene | 2 C6H6 + 15 O2 into 12 CO2 + 6 H2O, deltaH -3268   | 750 K |
| combustion-generic | any alkane + 2 O2 into 2 CO2 + 3 H2O, deltaH -1200 | 700 K |

Detonate and Spark exist precisely so fuel air mixes ignite: Detonate arms the spark flag and heats the chamber to at least 950 K, and Spark adds a 150 K pulse on top of its flag.

## Building up

| Rule                   | Reaction                                        | Needs               |
| ---------------------- | ----------------------------------------------- | ------------------- |
| polymerization-styrene | 3 styrene into polystyrene, deltaH -70          | 320 K plus catalyst |
| polymerization-ethene  | 4 ethene into polyethylene, deltaH -95          | 350 K plus catalyst |
| peptide-bond           | 2 glycine into diglycine plus water, deltaH +15 | 300 K plus catalyst |

## Functional group chemistry

| Rule | Reaction | Needs |
| --- | --- | --- |
| neutralization | acetic acid + ammonia into ammonium acetate, deltaH -45 | nothing |
| nitration | benzene + nitric acid into nitrobenzene + water, deltaH -65 | 300 to 340 K, catalyst, pH under 2 |
| hydrogenation | ethene + hydrogen into ethane, deltaH -136 | catalyst |

## Energetics and edge cases

| Rule | Reaction | Needs |
| --- | --- | --- |
| detonation-tnt | 2 TNT into nitrogen, carbon dioxide, water, deltaH -4200 | 500 K plus spark |
| detonation-nitroglycerin | 2 nitroglycerin into nitrogen, carbon dioxide, water, oxygen, deltaH -3800 | 450 K plus spark |
| crystallization | salt plus water, visual only | under 280 K |
| protein-folding | insulin, visual only | under 310 K |
| atp-hydrolysis | ATP into ADP plus phosphoric acid, deltaH -30 | nothing |

Crystallization and protein folding keep their reactants and only stage visuals with narration, modeling nucleation and collapse without pretending to change composition.

## Adding a rule

Confirm every id in the catalog, append a rule with conditions, energetics, a flash color, a particle kind, a rate law, a reference, and a one-line message, then cover it in `tests/reactions.test.ts`. See the contributing guide.
