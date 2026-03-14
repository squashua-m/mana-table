---
description: Add or edit a design token in the Canopy Design System. Use when the user says "add a token", "change the color of X", "new spacing value", or "update the radius for Y".
---

# Add or Edit a Design Token

Follow these steps in order.

---

## Step 1 — Edit the source token files

Dark theme (always required):
`packages/tokens/source/design-tokens-dark.json`

Light theme (only if the value differs between themes):
`packages/tokens/source/design-tokens-light.json`

Token format follows Style Dictionary conventions:

```json
{
  "color": {
    "action": {
      "action-new-token": { "value": "{color.brand.40}", "type": "color" }
    }
  }
}
```

Never hand-edit files under `packages/tokens/dist/` — they are generated output.

---

## Step 2 — Rebuild the token pipeline

```bash
npm run tokens:build    # from repo root
```

---

## Step 3 — Verify the output

Confirm the new CSS custom property appears in the expected output file:

```bash
grep "new-token" packages/tokens/dist/web/css/variables.css
```

---

## Step 4 — Update documentation (if new category or scale added)

If you added a brand new token category (not just a new value in an existing category), update the relevant file in `.claude/docs/references/` (e.g. `colors.md`, `spacing.md`, `effects.md`).

---

## Step 5 — Handle renamed tokens

If you renamed a token, find and update every stale `var(--canopy-ds-old-name)` usage:

```bash
grep -r "old-token-name" packages/react/src --include="*.module.css"
```

Update all references to the new name. Do not leave stale references.
