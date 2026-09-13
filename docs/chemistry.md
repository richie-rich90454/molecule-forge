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

- **Ionic salts.** A metal carries a stable cation charge; a nonmetal or metalloid carries an anion charge. The two are balanced to the smallest whole-number formula unit (`Ce` + `3 Br` into `CeBr3`, `2 Fe` + `3 O` into `Fe2O3`). The cation charge is chosen to consume the available atoms with the least waste, so iron takes `+3` when three bromides are present and `+2` when only two are. Formula, Stock name, formal charges, and geometry are generated on demand and cached.
- **Covalent molecules.** Exact element multisets map to catalogue molecules where one exists (`2 H + O` into water, `C + 2 O` into carbon dioxide, `H + Cl` into hydrogen chloride) and to generated records where one does not (`H + F` into hydrogen fluoride).
- **Diatomic elements.** Two monatomic atoms of a diatomic former combine (`2 O` into O2, `2 H` into H2, `2 I` into I2). A molecule that is already diatomic is not recombined.
- **Stoichiometry hints.** When a reactive pair is in contact but there are not enough atoms to balance a formula unit, the synthesis engine emits a plain-language hint instead of silently doing nothing, for example "Cerium(III) bromide needs 1 Ce and 3 Br per unit. Add more Br." Hints are deduplicated so the log does not spam.

Synthesized compounds carry the `functional` category and the tags `compound`, `synthesized`. They are runtime-only: they exist in the chamber and in reactions, not in the catalogue listing. The model is a valence and electronegativity approximation, not a quantum-chemistry solver; it does not model lattice energies, polyatomic ions, or kinetics beyond contact plus feasible stoichiometry.

## Geometry

`MoleculeFactory` expands implicit hydrogens from valence rules (with per-atom overrides for tricky pyrrole nitrogens and ions), places heavy atoms by breadth-first traversal using tetrahedral, trigonal, and linear direction sets that explicitly avoid folding back on the parent bond, drops hydrogens onto the emptiest directions, then relaxes everything: bonded springs pull toward reference lengths while a spatial grid pushes non-bonded overlaps apart, stopping early once the worst error drops under 0.15 angstroms. The overlap pass uses a numeric spatial hash and repeats only while overlaps remain, which keeps a full 507-molecule build well under a second. Multi-component records (salts, base pairs) are offset so counterions sit sensibly apart.

## Validation

`MoleculeValidator` enforces seven checks over every record: known elements, in-range bond indices (out-of-range bonds are reported and skipped, never dereferenced), valence caps (aromatic counts once, charged atoms get slack, hypervalent phosphorus and sulfur get more), a 0.5 angstrom minimum separation, covalent length limits (generous for metals), exact formula match, and mass within 0.6 Da. Run `bun run validate` any time; the suite re-checks all of it.

## Categories

Seventeen tabs, no more: alkanes, alkenes and alkynes, benzenoids and aromatics, functional groups, amino acids, sugars, nucleotides and nucleic acids, lipids and steroids, pharmaceuticals, neurotransmitters and hormones, polymers and materials, explosives and energetics, toxins and agents, exotic carbons, biomolecules, natural products, and the 101-entry elemental table of atoms and diatomics.
