# Contributing

## Tooling

Use `bun` for everything. Never `npm` or `npx`; use `bunx` for one-off tools.

```bash
bun install
bun run dev          # develop with hot reload
bun run build        # produce the dist folder
bun run test         # run the Vitest suite (338 tests, 100 percent coverage)
bun run validate     # validate all 2,703 molecules
bun run bake > docs/molecules.md  # regenerate the molecule listing
bun run docs:dev     # preview this site
bun run docs:build   # build this site
cargo test           # run the sixteen Rust unit tests
```

## Add a molecule

1. Add an entry to the JSON file for the molecule's category under `src/chem/data` (one file per tab). `schema.json` in that folder describes the format; every entry needs `id`, `name`, `formula`, `smiles`, `category`, `tags`, `warn`, and `inchi`.
2. Give a PubChem-verified connectivity SMILES plus the exact formula for anything with rings or heteroatoms. The loader parses the SMILES at load time; the parser supports the full hydrogen-to-plutonium element table, branches, ring closures, bond orders, aromatic `c n o s p`, bracketed charges and hydrogens, and dot-separated components, but not stereochemistry. Use an explicit `heavy` + `bonds` graph only when SMILES cannot express the species (ionic solids, coordination complexes, minerals); add `charges` and `ionicBonds` for salts.
3. Assign a P0-P8 `priority` (P0 loads first) and useful `tags`. Set `warn` to true only for genuinely hazardous molecules.
4. Run `bun run validate`. Fix valence, formula, or geometry complaints until it passes. Common issues: a fusion carbon carrying four bonds plus a double (move the double), a pyrrole nitrogen needing `explicitH`, an aromatic perimeter drawn with single bonds (hydrogens double up), or a hypervalent center whose element needs a higher valence allowance.
5. Run `bun run format`, stage only that file, and commit with a Conventional Commit message.

## Add an element

Append a row to `ElementRegistry` with atomic number, standard mass, covalent and van der Waals radii, a CPK-style display color, and maximum valence. Then append the matching row to `ElementChemistry` with electronegativity, element kind, common cations, and the typical anion and its name; `tests/synthesis.test.ts` asserts that every registered element has a chemistry row, so a missing entry fails the suite. Elements without special-cased hydrogens default to zero implicit hydrogens, which is correct for metals and noble gases.

## Add a reaction rule

1. Confirm every reactant and product id exists in the catalogue.
2. Append a rule in `src/sim/ReactionCatalog.ts` with conditions, activation energy, delta enthalpy, flash color, particle kind, rate law, reference, and a one-line message.
3. Cover it in `tests/reactions.test.ts`: one hot test that fires, one cold test that stays silent.
4. Format and commit the rule file separately from the test file.

## Extend synthesis

Synthesis needs no rule entry for new monatomic salts; the oxidation-state table already covers them. To add a polyatomic ion, append a row to `src/chem/PolyatomicIons.ts`; the generator there already derives the oxyanions of several central atoms from their oxidation state and oxygen count. To widen the covalent set, add a mapping in `CompoundSynthesizer` (`COVALENT_CATALOG` for an existing molecule, `COVALENT_SYNTH` for a generated record) and, for an accurate enthalpy, a formation enthalpy in `Thermochemistry`. To add an elemental allotrope, extend `ALLOTROPES`. To change which charge a metal prefers, reorder its `cations` list. Redox coverage comes from the reduction-potential table in `Thermochemistry`; add a couple there and cover it in `tests/redox.test.ts`. Oxidation reactivity is derived from electronegativity and bond energies, so adding a bond energy to `Thermochemistry` is usually all a new diatomic oxidizer needs. Solvent behaviour lives in `SolventModel` and the shared kinetics in `ReactionGate`. Cover every branch in `tests/synthesis.test.ts`, `tests/thermo.test.ts`, `tests/redox.test.ts`, and `tests/oxidation.test.ts`, including the stoichiometry hint path, the kinetic gates, atom conservation, multi-unit layout, and the activity correction.

## Add a preset

Append an entry in `src/presets/PresetCatalog.ts` with a unique seed, spawn list, and condition overrides. Keep total spawns modest so first paint stays instant. A test asserts every spawn id resolves to a real molecule, so a typo fails fast.

## Code style

Strict Java-idiomatic OOP in TypeScript and Rust: classes with explicit access modifiers, interfaces for contracts, constructor injection, no `any`, no module-level behavior. SolidJS components stay thin wrappers over view-model signals. Use American English everywhere. Run `bun run format` before every commit and never commit with `format:check` failing.

## Commits

One file per commit. See the commits page for the message format.
