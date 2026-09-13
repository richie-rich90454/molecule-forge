# Contributing

## Tooling

Use `bun` for everything. Never `npm` or `npx`; use `bunx` for one-off tools.

```bash
bun install
bun run dev          # develop with hot reload
bun run build        # produce dist/index.html
bun run test         # run the Vitest suite (234 tests, 100 percent coverage)
bun run validate     # validate all 507 molecules
bun run bake > docs/molecules.md  # regenerate the molecule listing
bun run docs:dev     # preview this site
bun run docs:build   # build this site
cargo test           # run the twelve Rust unit tests
```

## Add a molecule

1. Pick one of the 17 existing categories. Do not invent new ones.
2. Prefer `smilesDriven` with a PubChem-verified connectivity SMILES for anything with rings or heteroatoms. Verify the parse first with a scratch script comparing `formulaOf` output against the published formula.
3. For trivial inorganics and gases, use the one-line `gas` helper. For homologous series, write a small generator loop. For peptides, use `buildProtein` with residue codes plus disulfide pairs.
4. Run `bun run validate`. Fix valence, formula, or geometry complaints until it passes. Common issues: a fusion carbon carrying four bonds plus a double (move the double), a pyrrole nitrogen needing `explicitH`, an aromatic perimeter drawn with single bonds (hydrogens double up).
5. Run `bun run format`, stage only that file, and commit with a Conventional Commit message.

## Add an element

Append a row to `ElementRegistry` with atomic number, standard mass, covalent and van der Waals radii, a CPK-style display color, and maximum valence. Then append the matching row to `ElementChemistry` with electronegativity, element kind, common cations, and the typical anion and its name; `tests/synthesis.test.ts` asserts that every registered element has a chemistry row, so a missing entry fails the suite. Elements without special-cased hydrogens default to zero implicit hydrogens, which is correct for metals and noble gases.

## Add a reaction rule

1. Confirm every reactant and product id exists in the catalogue.
2. Append a rule in `src/sim/ReactionCatalog.ts` with conditions, activation energy, delta enthalpy, flash color, particle kind, rate law, reference, and a one-line message.
3. Cover it in `tests/reactions.test.ts`: one hot test that fires, one cold test that stays silent.
4. Format and commit the rule file separately from the test file.

## Extend synthesis

Synthesis needs no rule entry for new monatomic salts; the oxidation-state table already covers them. To add a polyatomic ion, append a row to `src/chem/PolyatomicIons.ts` with its formula, charge, element composition, heavy-atom graph, formal charges, explicit hydrogens, binding atom, and preference rank. The test suite asserts that every ion's formal charges sum to its declared charge and that its composition matches its atoms, so a typo fails fast. To widen the covalent set, add a mapping in `CompoundSynthesizer` (`COVALENT_CATALOG` for an existing molecule, `COVALENT_SYNTH` for a generated record). To add an elemental allotrope, extend `ALLOTROPES`. To change which charge a metal prefers, reorder its `cations` list. Cover every branch in `tests/synthesis.test.ts`, including the stoichiometry hint path, the kinetic gate, atom conservation, and multi-unit layout.

## Add a preset

Append an entry in `src/presets/PresetCatalog.ts` with a unique seed, spawn list, and condition overrides. Keep total spawns modest so first paint stays instant. A test asserts every spawn id resolves to a real molecule, so a typo fails fast.

## Code style

Strict Java-idiomatic OOP in TypeScript and Rust: classes with explicit access modifiers, interfaces for contracts, constructor injection, no `any`, no module-level behavior. SolidJS components stay thin wrappers over view-model signals. Use American English everywhere. Run `bun run format` before every commit and never commit with `format:check` failing.

## Commits

One file per commit. See the commits page for the message format.
