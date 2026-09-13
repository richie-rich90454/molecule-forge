# Chemistry layer

All files live in `src/chem`. Nothing here imports rendering, DOM, or simulation code.

## Records

An `IMoleculeRecord` is the single source of truth for a molecule: id, name, formula, SMILES, InChI, category, tags, warning flag, mass, per-atom entries (element, xyz, charge, stereo, aromatic), per-bond entries (endpoints, order, aromatic, stereo), estimated properties, and provenance. Compact specs (`ICompactMoleculeSpec`) store only heavy atoms plus bond tuples; hydrogens, coordinates, mass, and properties are derived at build time so they cannot drift out of sync.

## Element support

`ElementRegistry` covers every natural element from hydrogen through plutonium: atomic number, mass, covalent and van der Waals radii, CPK-style display colors, maximum valence, plus a table of reference bond lengths (C-C, C=C, C-H, C-N, C-O, Fe-N, and more, falling back to summed covalent radii). Unknown symbols throw loudly instead of rendering mystery atoms.

## Authoring molecules

There are three honest ways to add one, in order of preference:

1. **Verified SMILES** through `SmilesParser` for anything with rings or heteroatoms. Fetch the connectivity SMILES from PubChem, transcribe it with `smilesDriven`, and let the formula check prove the parse. The parser handles organic-subset elements, two-letter symbols, bracket atoms with charges and explicit hydrogens (`[nH]`, `[O-]`), bond orders including aromatic `:`, branches, numeric and `%`-style ring closures, and E/Z slashes.
2. **Explicit graphs** for small molecules: heavy symbol list plus `[a, b, order]` tuples, where order 4 means aromatic and an optional fourth slot marks E/Z.
3. **Builders** for families: `tileRepeat` for polymers, `buildProtein` for peptides and antibodies (with disulfides and C-terminal amides), glycosidic and nucleotide composers for sugars and DNA/RNA, lattice generators for diamond, graphene, nanotubes, and fullerene cages, and the one-line `gas` helper for trivial inorganics.

## Geometry

`MoleculeFactory` expands implicit hydrogens from valence rules (with per-atom overrides for tricky pyrrole nitrogens and ions), places heavy atoms by breadth-first traversal using tetrahedral, trigonal, and linear direction sets that explicitly avoid folding back on the parent bond, drops hydrogens onto the emptiest directions, then relaxes everything: bonded springs pull toward reference lengths while a spatial grid pushes non-bonded overlaps apart, stopping early once the worst error drops under 0.15 angstroms. Multi-component records (salts, base pairs) are offset so counterions sit sensibly apart.

## Validation

`MoleculeValidator` enforces seven checks over every record: known elements, in-range bond indices, valence caps (aromatic counts once, charged atoms get slack, hypervalent phosphorus and sulfur get more), a 0.5 angstrom minimum separation, covalent length limits (generous for metals), exact formula match, and mass within 0.6 Da. Run `bun run validate` any time; the suite re-checks all of it.

## Categories

Sixteen tabs, no more: alkanes, alkenes and alkynes, benzenoids and aromatics, functional groups, amino acids, sugars, nucleotides and nucleic acids, lipids and steroids, pharmaceuticals, neurotransmitters and hormones, polymers and materials, explosives and energetics, toxins and agents, exotic carbons, biomolecules, and natural products.
