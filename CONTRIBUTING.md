# Contributing

## Tooling

Use `bun` for everything. Never `npm` or `npx`; use `bunx` for one-off tools.

```bash
bun install
bun run dev
bun run test
bun run format
bun run format:check
bun run validate
bun run build
```

## Add a molecule

1. Pick one of the 16 existing categories. Do not invent new ones.
2. Add a record in `src/chem/MoleculeCatalog.ts`, either as an explicit heavy-atom graph or through `smilesDriven` with a PubChem-verified SMILES string.
3. Run `bun run validate`. Fix valence, formula, or geometry complaints until it passes.
4. Run `bun run format`, stage only that file, and commit with a Conventional Commit message.

## Add a reaction

1. Confirm every reactant and product id exists in the catalog.
2. Add a rule in `src/sim/ReactionCatalog.ts` with conditions, energetics, visuals, rate law, and reference.
3. Cover it with a test in `tests/reactions.test.ts`.
4. Format and commit the rule file separately from the test file.

## Code style

Strict Java-idiomatic OOP in TypeScript and Rust: classes with explicit access modifiers, interfaces for contracts, constructor injection, no `any`, no module-level behavior. Use American English everywhere. Run `bun run format` before every commit and never commit with `format:check` failing.

## Commits

One file per commit. See `COMMITS.md` for the message format.
