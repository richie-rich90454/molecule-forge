# Contributing

## Tooling

Use `bun` for everything. Never `npm` or `npx`; use `bunx` for one-off tools.

```bash
bun install
bun run dev          # develop with hot reload
bun run build        # produce dist/index.html
bun run test         # run the Vitest suite (20 tests)
bun run validate     # validate all 406 molecules
bun run bake > docs/molecules.md  # regenerate the molecule listing
bun run docs:dev     # preview this site
bun run docs:build   # build this site
cargo test           # run the twelve Rust unit tests
```

## Add a molecule

1. Pick one of the 16 existing categories. Do not invent new ones.
2. Prefer `smilesDriven` with a PubChem-verified connectivity SMILES for anything with rings or heteroatoms. Verify the parse first with a scratch script comparing `formulaOf` output against the published formula.
3. For trivial inorganics and gases, use the one-line `gas` helper. For homologous series, write a small generator loop. For peptides, use `buildProtein` with residue codes plus disulfide pairs.
4. Run `bun run validate`. Fix valence, formula, or geometry complaints until it passes. Common issues: a fusion carbon carrying four bonds plus a double (move the double), a pyrrole nitrogen needing `explicitH`, an aromatic perimeter drawn with single bonds (hydrogens double up).
5. Run `bun run format`, stage only that file, and commit with a Conventional Commit message.

## Add an element

Append a row to `ElementRegistry` with atomic number, standard mass, covalent and van der Waals radii, a CPK-style display color, and maximum valence. Elements without special-cased hydrogens default to zero implicit hydrogens, which is correct for metals and noble gases.

## Add a reaction

1. Confirm every reactant and product id exists in the catalog.
2. Append a rule in `src/sim/ReactionCatalog.ts` with conditions, activation energy, delta enthalpy, flash color, particle kind, rate law, reference, and a one-line message.
3. Cover it in `tests/reactions.test.ts`: one hot test that fires, one cold test that stays silent.
4. Format and commit the rule file separately from the test file.

## Add a preset

Append an entry in `src/presets/PresetCatalog.ts` with a unique seed, spawn list, and condition overrides. Keep total spawns modest so first paint stays instant.

## Code style

Strict Java-idiomatic OOP in TypeScript and Rust: classes with explicit access modifiers, interfaces for contracts, constructor injection, no `any`, no module-level behavior. SolidJS components stay thin wrappers over view-model signals. Use American English everywhere. Run `bun run format` before every commit and never commit with `format:check` failing.

## Commits

One file per commit. See the commits page for the message format.
