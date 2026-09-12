# Commit Conventions

Every commit touches exactly one file and follows the Conventional Commits spec:

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Scopes name the area touched: `chem`, `sim`, `render`, `ui`, `presets`, `audio`, `state`, `wasm`, `scripts`, `deps`, `docs`.

Rules:

- Subject uses imperative present tense, lowercase, no trailing period, 72 chars max.
- One file per commit. Never `git add .`. Never `--no-verify`.
- Run `bun run format` before staging. If a hook reformats, re-stage and recommit with the same message.
- If a change needs several files to compile, land a sequence of commits where each step still compiles where feasible.

Examples:

```
feat(chem): add caffeine molecule data
fix(sim): correct Lennard-Jones epsilon for sulfur
perf(render): batch aromatic bonds into single draw call
docs(readme): describe preset scenarios
chore(deps): bump three to 0.170.0
style(ui): apply oxfmt to Library component
```
