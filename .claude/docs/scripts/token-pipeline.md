# Token Pipeline — Canopy Design System

> When to run: after any Figma/Tokenator export updates a file in `tokens/` at the repo root.
> Root command: `npm run tokens:build`

---

## When to run the pipeline

Run `npm run tokens:build` whenever any of these files change:

| File | What changed |
|---|---|
| `tokens/semantic-tokens.json` | Colors, spacing, radius, motion, blur, elevation updated in Figma |
| `tokens/primitive-tokens.json` | Raw primitive values changed (color scales, spacing scale) |
| `tokens/typography-tokens.json` | Font sizes, weights, line heights, or type styles updated |
| `tokens/motion-tokens.json` | Duration values updated (if this file exists separately) |

Do not manually edit files in `packages/tokens/source/` or `packages/tokens/dist/` — they are generated and will be overwritten.

---

## Commands

| Command | When to use |
|---|---|
| `npm run tokens:build` | One-time build from repo root. Use after a Figma export. |
| `npm run tokens:watch` | Continuous rebuild from repo root. Use during active token development. |
| `npm run tokens:clean` | Delete `dist/`. Use if you need a clean build. |

From inside `packages/tokens/` directly:

```bash
# Same as tokens:build from root
npm run build

# Watch mode
npm run watch

# Clean
npm run clean
```

---

## What the pipeline produces

After a successful build:

| Output | Path | Used by |
|---|---|---|
| CSS variables (dark default + light override) | `packages/tokens/dist/web/variables.css` | Web apps — import once at entry point |
| JS token map (both themes) | `packages/tokens/dist/web/tokens.js` | JS/TS consumers |
| TypeScript token map | `packages/tokens/dist/web/tokens.ts` | TypeScript consumers |
| Type declarations | `packages/tokens/dist/web/tokens.d.ts` | TypeScript IDE support |
| Type-style classes | `packages/tokens/dist/web/type-styles.css` | `.type-*` classes |
| Typography CSS vars | `packages/tokens/dist/web/typography.css` | Typography custom properties |
| iOS Swift | `packages/tokens/dist/ios/Tokens.swift` | iOS native |
| Android XML | `packages/tokens/dist/android/colors.xml`, `dimens.xml` | Android Views |
| Android Kotlin | `packages/tokens/dist/android/Tokens.kt` | Android Compose |

---

## Pipeline steps (what runs under the hood)

```
tokens/*.json
    ↓
scripts/tokenator-to-sd.js --all-modes
    ↓
packages/tokens/source/design-tokens-dark.json
packages/tokens/source/design-tokens-light.json
packages/tokens/source/design-tokens-typography.json
    ↓
build.js → Style Dictionary (dark + light + typography)
    ↓
packages/tokens/dist/web/variables-dark.css
packages/tokens/dist/web/variables-light.css
    ↓
scripts/merge-theme-css.js
    ↓
packages/tokens/dist/web/variables.css   (:root = dark, [data-theme="light"] = overrides)
    ↓
scripts/build-theme-tokens.js
    ↓
packages/tokens/dist/web/tokens.js / tokens.ts / tokens.d.ts
```

---

## Custom source paths

If the token files are in non-default locations, override via environment variables:

```bash
TOKENATOR_JSON=../path/to/semantic-tokens.json npm run tokens:build
PRIMITIVES_JSON=../path/to/primitive-tokens.json npm run tokens:build
TYPOGRAPHY_JSON=../path/to/typography-tokens.json npm run tokens:build
```

Or pass positional arguments directly to the converter:

```bash
node packages/tokens/scripts/tokenator-to-sd.js path/to/semantic-tokens.json \
  --all-modes \
  --primitives=path/to/primitive-tokens.json
```

---

## Troubleshooting

**`[unresolved]` tokens in the output** — A `$ref` in `semantic-tokens.json` points to a primitive name that doesn't exist in `primitive-tokens.json`. Check that the primitive file is present and the ref name matches exactly.

**Build succeeds but CSS vars are missing** — The converter ran but a token category may have been filtered. Check `packages/tokens/source/design-tokens-dark.json` to confirm the expected tokens are present after conversion.

**Type styles are a placeholder** — `tokens/typography-tokens.json` is missing. The build falls back to placeholder CSS. Export the typography tokens from Figma and re-run.

**dist/ has stale files after a token rename** — Run `npm run tokens:clean` then `npm run tokens:build` to force a clean rebuild.

---

## Do / Don't

| Do | Don't |
|---|---|
| Run `npm run tokens:build` from repo root after every token source change | Run the build from inside `packages/tokens/` with `npm run build` — use the root workspace command |
| Edit token source files in `tokens/*.json` (repo root) | Edit files under `packages/tokens/source/` or `packages/tokens/dist/` — they are generated and overwritten |
| Run `npm run tokens:clean` before rebuilding if a token was renamed | Leave stale dist files in place and assume they match the source |
| Use `npm run tokens:watch` during active token development | Run `tokens:build` manually after every single change |
| Check `packages/tokens/dist/web/variables.css` to verify output | Assume the build succeeded without checking the output |

```bash
# Do: workspace command from repo root
npm run tokens:build

# Don't: run from inside the package (error-prone if workspace isn't linked)
cd packages/tokens && npm run build
```

```bash
# Do: clean rebuild when tokens are renamed
npm run tokens:clean && npm run tokens:build

# Don't: leave stale files after a rename — components will reference old variable names
npm run tokens:build   # without cleaning first
```

```bash
# Do: verify the output
grep "my-new-token" packages/tokens/dist/web/variables.css

# Don't: skip verification — a misconfigured ref or typo can silently produce no output
```
