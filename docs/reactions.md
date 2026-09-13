# Reactions

Four engines run in the fixed-step loop, all publishing the same event type so the log, flashes, particles, and sound are uniform.

1. **`ReactionEngine`** applies the fifteen hand-authored rules in `src/sim/ReactionCatalog.ts`.
2. **`SynthesisEngine`** predicts new compounds from loose atoms using `CompoundSynthesizer` and the `ElementChemistry` table.
3. **`RedoxEngine`** swaps metals using the standard reduction potentials in `Thermochemistry`.
4. **`OxidationEngine`** abstracts hydrogen from compounds with any electronegative diatomic.

## Rule engine

`ReactionEngine` scans its rules at 20 Hz: it picks an anchor molecule matching the first reactant, gathers the remaining partners within 7 angstroms, checks temperature, pH, spark, and catalyst conditions, then rolls an Arrhenius probability `min(0.5, exp(-Ea / RT) * boost * 8)` against the seeded RNG. On success it removes reactants, spawns products at the centroid, and publishes a visual plus a log line. Every reactant and product id must exist in the catalogue.

### Combustion

| Rule               | Reaction                                           | Needs |
| ------------------ | -------------------------------------------------- | ----- |
| combustion-methane | CH4 + 2 O2 into CO2 + 2 H2O, deltaH -890           | 700 K |
| combustion-ethene  | C2H4 + 3 O2 into 2 CO2 + 2 H2O, deltaH -1411       | 700 K |
| combustion-benzene | 2 C6H6 + 15 O2 into 12 CO2 + 6 H2O, deltaH -3268   | 750 K |
| combustion-generic | any alkane + 2 O2 into 2 CO2 + 3 H2O, deltaH -1200 | 700 K |

Detonate and Spark exist precisely so fuel air mixes ignite: Detonate arms the spark flag and heats the chamber to at least 950 K, and Spark adds a 150 K pulse on top of its flag.

### Building up

| Rule                   | Reaction                                        | Needs               |
| ---------------------- | ----------------------------------------------- | ------------------- |
| polymerization-styrene | 3 styrene into polystyrene, deltaH -70          | 320 K plus catalyst |
| polymerization-ethene  | 4 ethene into polyethylene, deltaH -95          | 350 K plus catalyst |
| peptide-bond           | 2 glycine into diglycine plus water, deltaH +15 | 300 K plus catalyst |

### Functional group chemistry

| Rule | Reaction | Needs |
| --- | --- | --- |
| neutralization | acetic acid + ammonia into ammonium acetate, deltaH -45 | nothing |
| nitration | benzene + nitric acid into nitrobenzene + water, deltaH -65 | 300 to 340 K, catalyst, pH under 2 |
| hydrogenation | ethene + hydrogen into ethane, deltaH -136 | catalyst |

### Energetics and edge cases

| Rule | Reaction | Needs |
| --- | --- | --- |
| detonation-tnt | 2 TNT into nitrogen, carbon dioxide, water, deltaH -4200 | 500 K plus spark |
| detonation-nitroglycerin | 2 nitroglycerin into nitrogen, carbon dioxide, water, oxygen, deltaH -3800 | 450 K plus spark |
| crystallization | salt plus water, visual only | under 280 K |
| protein-folding | insulin, visual only | under 310 K |
| atp-hydrolysis | ATP into ADP plus phosphoric acid, deltaH -30 | nothing |

Crystallization and protein folding keep their reactants and only stage visuals with narration, modeling nucleation and collapse without pretending to change composition.

## Synthesis engine

`SynthesisEngine` reacts free atoms on contact, which is why placing a metal next to a halogen actually forms a compound instead of doing nothing.

- It treats any molecule of one or two atoms of a single element as an available atom source (the `el-*` monatomic atoms, and diatomics such as Br2, O2, H2), along with allotropes such as S8.
- It groups sources within 7 angstroms into clusters, tallies the atoms, and asks `CompoundSynthesizer` what can form.
- If a compound is feasible it consumes the required number of atoms from the cluster, returns any overshoot as free atoms, and spawns the product instances spaced apart like a small lattice. Atoms are conserved exactly.
- It only reacts above 5 K; molecular covalent synthesis additionally needs about 250 K or a spark, so cold chambers stay still and ionic melts do not.
- If a pair is reactive but the local cluster has the wrong ratio, it logs one deduplicated stoichiometry hint that names the limiting element instead of staying silent.

Prediction order is ionic first, then a covalent catalogue molecule, then a diatomic or allotrope, then a hint. That ordering is deliberate: with cerium and bromine present, `CeBr3` wins over `Br2`; with only two bromine atoms and no metal, `Br2` forms.

Examples:

| Input atoms           | Product                      | Notes                              |
| --------------------- | ---------------------------- | ---------------------------------- |
| 1 Ce + 3 Br           | CeBr3, cerium(III) bromide   | charge-balanced 1:3                |
| 1 Ce + 4 Br           | CeBr4, cerium(IV) bromide    | cation charge chosen to fit        |
| 2 Fe + 3 O            | Fe2O3, iron(III) oxide       | multi-cation formula               |
| 1 Fe + 2 Br           | FeBr2, iron(II) bromide      | lower charge fits                  |
| 1 Ca + 3 Cl           | CaCl2 + 1 free Cl            | surplus returned as an atom        |
| 1 Al + 2 Cl2          | AlCl3 + 1 free Cl            | diatomic overshoot returned        |
| 1 Na + 1 O + 1 H      | NaOH, sodium hydroxide       | polyatomic hydroxide               |
| 1 Ca + 2 O + 2 H      | Ca(OH)2, calcium hydroxide   | repeated complex ion parenthesized |
| 2 Na + 1 S + 4 O      | Na2SO4, sodium sulfate       | polyatomic sulfate                 |
| 1 K + 1 N + 3 O       | KNO3, potassium nitrate      | polyatomic nitrate                 |
| 1 Ca + 1 C + 3 O      | CaCO3, calcium carbonate     | polyatomic carbonate               |
| 2 Fe + 3 S + 12 O     | Fe2(SO4)3, iron(III) sulfate | trivalent metal, divalent anion    |
| 1 N + 4 H + 1 Cl      | NH4Cl, ammonium chloride     | polyatomic cation                  |
| 2 N + 8 H + 1 S + 4 O | (NH4)2SO4, ammonium sulfate  | two complex ions                   |
| 2 H + 1 O             | water                        | covalent catalogue molecule        |
| 4 H + 2 O             | 2 H2O                        | stoichiometry scaled to the atoms  |
| 1 C + 4 H             | CH4, methane                 | covalent catalogue molecule        |
| 1 H + 1 F             | HF, hydrogen fluoride        | generated covalent record          |
| 1 Xe + 4 F            | XeF4, xenon tetrafluoride    | noble gas fluoride                 |
| 2 H + 2 F             | 2 HF                         | diatomic reagents combine          |
| 4 P                   | P4, tetraphosphorus          | elemental allotrope                |
| 8 S                   | S8, cyclooctasulfur          | elemental allotrope                |
| 2 O                   | O2                           | diatomic recombination             |
| 1 Ce + 2 Br           | hint only                    | "needs 1 Ce and 3 Br per unit"     |
| 2 H + 1 F (cold)      | hint only                    | "needs more heat to form"          |

The synthesizer is a valence and electronegativity model with common oxidation states and a curated polyatomic ion table, not a full quantum solver. It does not compute redox potentials or reaction enthalpies, so competition between several valid products is resolved by a documented preference order (oxygen-bearing and multiply-charged anions first, then atom economy, then charge product) rather than by free energy. It does not model solvent structure or polyatomic ions beyond the table, and it draws ionic solids as discrete bonded clusters rather than infinite lattices.

## Redox and thermochemistry

`SynthesisEngine` computes a reaction enthalpy for every product and reports it in the log. Covalent and elemental values come from standard formation enthalpies and bond energies; binary ionic values come from a Born-Haber cycle with ionization energies, electron affinities, and a Kapustinskii lattice energy. Products that are strongly endothermic are held back until the chamber is hot or sparked. Where a datum is missing the enthalpy is reported as null and the ordering heuristic decides, so no number is fabricated.

`RedoxEngine` handles single displacement. A free metal atom in contact with a salt of a less reducing metal is swapped for it when the cell potential from the standard reduction table is positive: zinc + copper chloride gives zinc chloride + copper (1.10 V), while the reverse does not fire. The engine also respects the chamber's atom budget.

`SolventModel` supplies the continuum solvent: it computes ionic strength from the formal charges in the chamber and the chamber volume, then a Debye-Huckel activity coefficient that corrects the endothermic threshold. A salt-rich chamber is treated as a higher-ionic-strength medium.

## Oxidation

`OxidationEngine` reacts any homonuclear diatomic element that is more electronegative than hydrogen, all the way up to plutonium, with a hydrogen-bearing compound. It breaks the diatomic bond and a site hydrogen, forms a site-oxidizer bond and an H-X bond, picks the most exothermic site, and reports the computed enthalpy. Fluorine reacts on contact; chlorine, bromine, and iodine need heat; oxygen and nitrogen are held back by their activation barrier so combustion remains with the rule engine.

| Reactants | Products       | Conditions                  |
| --------- | -------------- | --------------------------- |
| CH4 + F2  | CH3F + HF      | ambient                     |
| C6H6 + F2 | C6H5F + HF     | ambient                     |
| H2O + F2  | HOF + HF       | ambient                     |
| CH4 + Cl2 | CH3Cl + HCl    | about 900 K                 |
| CH4 + I2  | CH3I + HI      | about 1500 K                |
| CH4 + O2  | no abstraction | combustion handled by rules |

## Adding a rule

Confirm every id in the catalogue, append a rule with conditions, energetics, a flash color, a particle kind, a rate law, a reference, and a one-line message, then cover it in `tests/reactions.test.ts`. To extend synthesis instead, add the element row to `ElementChemistry` or the covalent mapping to `CompoundSynthesizer` and cover it in `tests/synthesis.test.ts`. See the contributing guide.
