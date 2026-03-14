# Icon Sprite Builder — Canopy Design System

> When to run: after adding, removing, or modifying any `.svg` file in `/icons/` at the repo root.
> Command: `npm run build:icons` from `packages/react/`.

---

## When to run

| Trigger | Action |
|---|---|
| Added a new `.svg` to `/icons/` | Run `npm run build:icons` |
| Modified an existing `.svg` in `/icons/` | Run `npm run build:icons` |
| Removed an `.svg` from `/icons/` | Run `npm run build:icons` |

The generated file is committed to the repo — after running, commit both the source SVG and the updated `icon-sprite.generated.js`.

---

## Command

```bash
# From packages/react/
npm run build:icons

# From repo root
npm run build:icons -w @canopy-ds/react
```

---

## What it reads and writes

**Reads:** All `.svg` files in `/icons/` (repo root), sorted alphabetically by filename.

**Writes:** `packages/react/src/icons/generated/icon-sprite.generated.js`

The output file exports:
- `iconSprite` — the full hidden SVG spritesheet string (`<svg style="display:none"><symbol id="canopy-icon-<name>">…</symbol>…</svg>`)
- `ICON_NAMES` — a `const`-typed array of all icon name strings (filename without `.svg` extension, kebab-case)

---

## Transforms applied automatically

The build script (`scripts/build-icon-sprite.mjs`) applies these transforms to every SVG:

| Transform | What it does |
|---|---|
| Outer `<svg>` stripped | Inner content only is extracted; the wrapping `<svg>` tag is removed |
| `stroke="black"` → `stroke="currentColor"` | Icons inherit stroke color from CSS/parent |
| `stroke-width` removed | All `stroke-width` attributes are removed from source; set at render time via the `thickness` prop on `<Icon>` |
| `vector-effect="non-scaling-stroke"` added | Added to every `<path>`. Ensures stroke width is always exact screen pixels regardless of rendered size |
| IDs namespaced | All `id` attributes and `url(#...)` references are prefixed with `canopy-icon-<name>-` to prevent ID collisions between symbols in the same document |

---

## Rules for source SVGs

When creating or editing SVGs to add to `/icons/`:

1. **24×24 viewBox.** All icons must use `viewBox="0 0 24 24"`. The `<Icon>` component renders at sizes 16/24/32/48px but always with a 24×24 viewBox — the SVG scales.
2. **Stroke-based, not fill-based.** Icons should use `stroke` paths. The build replaces `stroke="black"` with `currentColor` — don't use `fill` for the icon lines.
3. **No `stroke-width` in source.** Remove all `stroke-width` from the SVG file. The `<Icon>` component controls stroke width via the `thickness` prop at render time.
4. **No external dependencies.** No `<image>` tags, no external `href`, no font references.
5. **Kebab-case filenames.** The filename (without `.svg`) becomes the icon name: `arrow-right.svg` → `name="arrow-right"`.
6. **Do not edit the generated file.** `icon-sprite.generated.js` is always overwritten on rebuild.

---

## How icon names are derived

The icon name used in `<Icon name="..." />` is the SVG filename without the `.svg` extension, lowercased, with spaces replaced by hyphens.

| File | Icon name |
|---|---|
| `icons/arrow-right.svg` | `arrow-right` |
| `icons/check-circle.svg` | `check-circle` |
| `icons/user-plus.svg` | `user-plus` |

Full list of available icon names: see [references/iconography.md](../references/iconography.md).

---

## Checking available icons

In JavaScript/TypeScript, import the `ICON_NAMES` constant for autocomplete and validation:

```js
import { ICON_NAMES } from "@canopy-ds/react";
// ICON_NAMES is a const-typed string array of all valid names
```

Or check the export directly:

```bash
node -e "import('./packages/react/src/icons/generated/icon-sprite.generated.js').then(m => console.log(m.ICON_NAMES.join('\n')))"
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Run `npm run build:icons` from `packages/react/` after any SVG change in `/icons/` | Manually edit `icon-sprite.generated.js` — it is always overwritten on rebuild |
| Commit both the source `.svg` and the updated `icon-sprite.generated.js` together | Commit only the source SVG without regenerating the sprite |
| Use a 24×24 viewBox for all source SVGs | Use a different viewBox (e.g. 20×20, 32×32) — the `<Icon>` component assumes 24×24 |
| Use stroke-based paths; remove `stroke-width` from source | Include `stroke-width` in the SVG — it will be ignored and stripped by the build |
| Name SVG files in kebab-case (`arrow-right.svg`) | Use spaces or underscores (`arrow right.svg`, `arrow_right.svg`) |

```bash
# Do: regenerate after adding/changing SVGs, commit both files
cp my-icon.svg /path/to/canopy-ds/icons/
npm run build:icons   # from packages/react/
git add icons/my-icon.svg packages/react/src/icons/generated/icon-sprite.generated.js
git commit -m "add my-icon to icon sprite"

# Don't: add the SVG without rebuilding
cp my-icon.svg icons/
git add icons/my-icon.svg
git commit -m "add icon"   # sprite not updated — <Icon name="my-icon"> will render nothing
```

```xml
<!-- Do: 24×24 viewBox, stroke paths, no stroke-width -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path stroke="currentColor" fill="none" d="M5 12h14M12 5l7 7-7 7"/>
</svg>

<!-- Don't: wrong viewBox, fill-based, hardcoded stroke-width -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <path fill="#000000" stroke-width="2" d="M4 10h12"/>
</svg>
```
