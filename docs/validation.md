# Validation

## Geometry pipeline

Each record starts from a heavy-atom graph with bond orders, formal charges, stereochemistry flags, and aromaticity marks. Compact graphs come from hand-built records or from PubChem connectivity SMILES transcribed through `SmilesParser`. `MoleculeFactory` expands implicit hydrogens from valence rules (with per-atom overrides for pyrrole nitrogens and ions), embeds 3D coordinates with CSD-derived bond lengths and ideal hybridization geometries chosen to avoid folding back on the parent bond, drops hydrogens onto the emptiest directions, then relaxes everything: bonded springs pull toward reference lengths while a 27-cell spatial grid pushes non-bonded overlaps apart, stopping early once the worst error drops under 0.15 angstroms. Multi-component records (salts, base pairs) offset so counterions sit sensibly apart.

## Automatic checks

`MoleculeValidator` runs over all 406 records in `bun run validate` and in the test suite:

1. Every element is known (hydrogen through plutonium) and every bond index is in range, with no self bonds.
2. Valence caps hold: aromatic bonds count once, charged atoms get +1 slack, hypervalent phosphorus and sulfur get +2.
3. No two atoms sit closer than 0.5 angstroms.
4. No covalent bond exceeds its limit (2.3 angstroms, 2.4 for metals, so C-I at 2.14 passes).
5. The atom inventory matches the molecular formula exactly, parsed with a real formula grammar.
6. The computed mass matches the stored mass within 0.6 Da.

## Complex molecules

Drugs and cofactors with twenty or more heavy atoms are transcribed from PubChem connectivity SMILES, and the parsed formula must equal the published formula before the record ships. Notable catches during development included a 14-atom pyrene SMILES filed under coronene, a five-membered coronene outer ring, and a triple bond on the wrong side of the tabun cyano group. Fused PAHs, steroids, porphyrins, peptides, oligosaccharides, oligonucleotides, and polymers each went through validator-driven iteration until every hydrogen was accounted for.

## Gases and inorganics

Small molecules use the one-line `gas` helper: symbols, bonds, charges, and explicit hydrogens where resonance demands them (nitrogen dioxide, nitrous oxide). Noble gases are single unbonded atoms. Ionic salts are unbonded components with integer charges, which also exercises the multi-component embedding path.
