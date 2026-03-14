---
description: Add a new SVG icon to the Canopy Design System sprite. Use when the user says "add an icon" or "new icon called X".
---

# Add a New Icon

Follow these steps in order.

---

## Step 1 — Place the SVG in the source folder

```
icons/icon-name.svg
```

Rules for the source SVG:
- Artboard: 24×24 viewBox
- Strokes only (no filled paths) — stroke color set to `#000000` or `currentColor`
- No inline `fill` or `stroke` attributes on paths (the build script replaces them)
- Filename: kebab-case, matches the intended `<Icon name="icon-name" />` prop value

---

## Step 2 — Rebuild the icon sprite

```bash
npm run build:icons    # from packages/react/
```

The script reads `icons/`, applies transforms (currentColor, non-scaling-stroke, symbol IDs), and writes the sprite to `packages/react/src/icons/sprite.svg`. Never edit `sprite.svg` by hand.

---

## Step 3 — Update icon documentation

`.claude/docs/references/iconography.md` — add the new icon name to the icon list.

---

## Step 4 — Verify in Storybook

```bash
npm run storybook    # from repo root
```

Open the Icons story and confirm the new icon renders correctly.
