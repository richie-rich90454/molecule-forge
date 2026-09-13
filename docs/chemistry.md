# Chemistry layer

All files live in `src/chem`. Nothing here imports rendering, DOM, or simulation code.

## Records

An `IMoleculeRecord` is the single source of truth for a molecule: id, name, formula, SMILES, InChI, category, tags, warning flag, mass, per-atom entries (element, xyz, charge, stereo, aromatic), per-bond entries (endpoints, order, aromatic, stereo), estimated properties, and provenance. Compact specs (`ICompactMoleculeSpec`) store only heavy atoms plus bond tuples; hydrogens, coordinates, mass, and properties are derived at build time so they cannot drift out of sync.

## Element support

`ElementRegistry` covers every natural element from hydrogen through plutonium: atomic number, mass, covalent and van der Waals radii, CPK-style display colors, maximum valence, plus a table of reference bond lengths (C-C, C=C, C-H, C-N, C-O, Fe-N, and more). When a specific bond order has no table entry the length falls back to summed covalent radii with an order correction, so every element pair has a defensible length. Unknown symbols throw loudly instead of rendering mystery atoms.

## Element chemistry

`ElementChemistry` adds the data chemistry needs to predict bonding, one row per element H through Pu:

- **Pauling electronegativity** for polarity and metal-versus-nonmetal character.
- **Element kind** (alkali, alkaline, transition, post-transition, metalloid, nonmetal, halogen, noble, lanthanide, actinide).
- **Common oxidation states** as an ordered cation list, most common first (cerium `3,4`, iron `3,2`, copper `2,1`, uranium `6,4`).
- **Typical anion charge and anion name** for nonmetals and metalloids (O `-2`/oxide, Br `-1`/bromide, S `-2`/sulfide).

From that table the layer derives metal/noble/anion classifications, Stock-style cation names (`Cerium(III)`, `Iron(II)`), anion names, compound names, and greatest common divisors for charge balancing.

## Authoring molecules

There are three honest ways to add catalogue molecules, in order of preference:

1. **Verified SMILES** through `SmilesParser` for anything with rings or heteroatoms. Fetch the connectivity SMILES from PubChem, transcribe it with `smilesDriven`, and let the formula check prove the parse. The parser handles organic-subset elements, two-letter symbols, bracket atoms with charges and explicit hydrogens (`[nH]`, `[O-]`, `[Fe+2]`), bond orders including aromatic `:`, branches, numeric and `%`-style ring closures, component separators (`.` and `+`), and E/Z slashes assigned to the double bond.
2. **Explicit graphs** for small molecules: heavy symbol list plus `[a, b, order]` tuples, where order 4 means aromatic and an optional fourth slot marks E/Z.
3. **Builders** for families: `tileRepeat` for polymers, `buildProtein` for peptides and antibodies (with disulfides and C-terminal amides), glycosidic and nucleotide composers for sugars and DNA/RNA, lattice generators for diamond, graphene, nanotubes, and fullerene cages, and the one-line `gas` helper for trivial inorganics. Glycine has an explicit empty side chain so peptides that use `G` build correctly.

## Runtime synthesis

`CompoundSynthesizer` predicts and builds compounds that are not in the catalogue, which is what makes loose atoms react instead of sitting inert:

- **Ionic salts, monatomic and polyatomic.** A metal carries a stable cation charge; a nonmetal, metalloid, or polyatomic ion carries an anion charge. The two are balanced to the smallest whole-number formula unit (`Ce` + `3 Br` into `CeBr3`, `2 Fe` + `3 O` into `Fe2O3`, `Na` + `O` + `H` into `NaOH`). The cation charge is chosen to consume the available atoms with the least waste, so iron takes `+3` when three bromides are present and `+2` when only two are.
- **Polyatomic ions.** `PolyatomicIons` supplies hydroxide, cyanide, peroxide, nitrate, nitrite, carbonate, bicarbonate, sulfate, sulfite, phosphate, hydrogen phosphate, permanganate, chromate, hypochlorite, chlorate, perchlorate, acetate, and oxalate as anions, plus ammonium as a cation. A generator extends the set beyond that table to the oxyanions of bromine, iodine, arsenic, selenium, tellurium, silicon, germanium, boron, and antimony (bromate, iodate, arsenate, selenate, tellurate, silicate, germanate, borate, antimonate, and their lower oxidation states), deriving each ion's composition, formal charge, and connectivity from its central oxidation state and oxygen count. The synthesizer assembles them with their counter-ions into real salts and groups repeated complex ions in the formula: `Ca(OH)2`, `Na2SO4`, `KNO3`, `CaCO3`, `Fe2(SO4)3`, `(NH4)2SO4`, `NaBrO3`. Each ion's formal charges sum to its declared charge, which the test suite asserts directly.
- **Covalent molecules.** An element multiset is matched against known formulas and the most stable product wins by standard enthalpy of formation. Exact stoichiometry is preferred, and any surplus atoms are left beside the product rather than forcing an odd ratio, so `2 H + 2 O` makes water with the spare oxygen left over, `4 H + 2 O` makes two waters, and `2 C + 4 O` makes two carbon dioxides. Water, carbon dioxide, carbon monoxide, ammonia, methane, nitrous oxide, hydrogen sulfide, hydrogen chloride, hydrogen bromide, and sulfur dioxide come from the catalogue; hydrogen fluoride is generated. Hydrogen peroxide exists as a placeable molecule but is never the default product, because water is far more stable. Xenon, krypton, and radon form fluorides (`Xe` + `4 F` into XeF4); helium, neon, and argon stay inert.
- **Elemental allotropes.** Two monatomic atoms of a diatomic former combine (`2 O` into O2, `2 I` into I2), eight sulfurs close into the S8 ring, and four phosphorus atoms form the P4 tetrahedron.
- **Kinetics.** Ionic pairing and radical recombination happen on contact. Molecular covalent synthesis needs roughly 250 K of thermal energy (or a spark), and nothing reacts below 5 K, so a cryogenic chamber stays still while an ionic melt does not.
- **Stoichiometry hints.** When a reactive pair is in contact but there are not enough atoms to balance a formula unit, the synthesis engine emits a plain-language hint that names the limiting element, for example "Cerium(III) bromide needs 1 Ce and 3 Br per unit. Add more Br." Hints are deduplicated so the log does not spam.

Synthesized compounds carry the `functional` category and the tags `compound`, `synthesized`. They are runtime-only: they exist in the chamber and in reactions, not in the catalogue listing. The model is a valence and electronegativity approximation, not a quantum-chemistry solver; it does not compute redox potentials or enthalpies, and it draws ionic solids as discrete bonded clusters with their formula units spaced apart.

## Thermochemistry

`Thermochemistry` holds standard data and computes reaction enthalpies rather than asserting them:

- **Covalent and elemental** enthalpies come from standard enthalpies of formation of the gaseous products (water -241.8, carbon dioxide -393.5, methane -74.8, HF -271.1 kJ/mol, and so on) and from bond dissociation energies for generated structures, summed against the atomization enthalpy of the free atoms that are consumed. So `2 H + O` is computed as -927 kJ/mol, `2 O into O2` as -498, and `2 H + 2 F into 2 HF` as -1136.
- **Binary ionic** enthalpies use a Born-Haber cycle: the atomization enthalpy plus successive ionization energies of the cation, minus the electron affinity of the anion, minus the Kapustinskii lattice energy built from the ions' Shannon radii and charge product.
- The engine gates strongly endothermic products behind heat or a spark and reports the computed delta-H in every reaction log line.

Where a standard datum genuinely does not exist the computation returns null and the reaction falls back to the ordering heuristic instead of inventing a number.

## Redox potentials

`Thermochemistry` also carries a table of standard reduction potentials. `RedoxEngine` uses them directly: when a free metal atom sits within contact range of a salt whose cation is less reducing, it computes the cell potential `E(cathode) - E(anode)` and, when positive, swaps them. Zinc displaces copper from copper chloride (`E-cell` 1.10 V) while copper cannot displace zinc. The engine never fires when the cell potential is zero or negative.

## Oxidation and hydrogen abstraction

`OxidationEngine` has two data-driven modes, and `DecompositionEngine` adds a third path for large molecules.

- **Halogenation.** A halogen diatomic abstracts a hydrogen and inserts itself: `CH4 + F2` gives `CH3F + HF`, `C6H6 + F2` gives `C6H5F + HF`, `H2O + F2` gives `HOF + HF`. The engine reconstructs the target's bond graph from its record, chooses the substitution with the most exothermic bond-energy change, preserves formal charges and aromaticity, and rebuilds the product geometry. Kinetics come from data, not a list: a fluorine-class halogen (electronegativity at least 3.5) reacts on contact, while weaker halogens need thermal activation from an Evans-Polanyi style barrier. Only valence-one halogens take this path, so the inserted atom never picks up a phantom hydrogen.
- **Combustion.** Dioxygen burns any fuel containing C, H, or S. The engine derives the balanced equation from the fuel's own atoms, consuming a whole number of fuel and oxygen molecules, and fires once the chamber is hot or sparked: `CH4 + 2 O2` into `CO2 + 2 H2O`, `2 C8H18 + 25 O2` into `16 CO2 + 18 H2O`, `2 CO + O2` into `2 CO2`, `2 H2S + 3 O2` into `2 SO2 + 2 H2O`, `4 NH3 + 3 O2` into `2 N2 + 6 H2O`. Atom counts are conserved exactly. Nitrogen gas stays inert because its bond energy is too high.
- **Pyrolysis.** Above about 1200 K, `DecompositionEngine` splits an organic molecule with six or more heavy atoms at its most balanced bond into two fragments, conserving every atom. Rings have no bridge and stay whole, so large chains, polymers, and proteins disintegrate while small molecules and aromatics do not.

## Solvent model

`SolventModel` treats the chamber as a continuum electrolyte. It computes ionic strength from the formal charges present and the chamber volume, and derives Debye-Huckel activity coefficients from it. The activity corrects the thermal gate for endothermic synthesis, so a concentrated ionic melt raises the energy needed for an unfavorable product. This is an ionic-atmosphere (continuum) solvent model, not explicit solvated molecules.

## Geometry

`MoleculeFactory` expands implicit hydrogens from valence rules (with per-atom overrides for tricky pyrrole nitrogens and ions), places heavy atoms by breadth-first traversal using tetrahedral, trigonal, and linear direction sets that explicitly avoid folding back on the parent bond, drops hydrogens onto the emptiest directions, then relaxes everything: bonded springs pull toward reference lengths while a spatial grid pushes non-bonded overlaps apart, stopping early once the worst error drops under 0.15 angstroms. Every record carries its complete bond graph, including every element-hydrogen bond, so chemistry and rendering see the same connectivity. The overlap pass uses a numeric spatial hash and repeats only while overlaps remain, which keeps a full 507-molecule build well under a second. Multi-component records (salts, base pairs) are offset so counterions sit sensibly apart.

## Validation

`MoleculeValidator` enforces seven checks over every record: known elements, in-range bond indices (out-of-range bonds are reported and skipped, never dereferenced), valence caps (aromatic counts once, charged atoms get slack, hypervalent phosphorus and sulfur get more), a 0.5 angstrom minimum separation, covalent length limits (generous for metals), exact formula match, and mass within 0.6 Da. Run `bun run validate` any time; the suite re-checks all of it.

## Categories

Seventeen tabs, no more: alkanes, alkenes and alkynes, benzenoids and aromatics, functional groups, amino acids, sugars, nucleotides and nucleic acids, lipids and steroids, pharmaceuticals, neurotransmitters and hormones, polymers and materials, explosives and energetics, toxins and agents, exotic carbons, biomolecules, natural products, and the 101-entry elemental table of atoms and diatomics.
