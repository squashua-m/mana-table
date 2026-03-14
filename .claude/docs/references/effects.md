# Effects Tokens — Canopy Design System

> Source of truth: `tokens/semantic-tokens.json` → Blur and Elevation collections.
> Blur CSS pattern: `--canopy-ds-blur-<size>` (value in `px`)
> Elevation CSS pattern: `--canopy-ds-elevation-<level>-<layer>-<property>`

---

## Blur Tokens

Background blur values for frosted-glass / glassmorphism effects. Values are in `px` and do not vary by theme.

| Token         | CSS Variable            | Value | Use for                                              |
|---------------|-------------------------|-------|------------------------------------------------------|
| `blur-sm`     | `--canopy-ds-blur-sm`    | 4px   | Subtle frost; nearly transparent overlays            |
| `blur-md`     | `--canopy-ds-blur-md`    | 12px  | Standard glass surfaces (buttons, cards, headers)    |
| `blur-lg`     | `--canopy-ds-blur-lg`    | 24px  | Heavy frost; modal backdrops, full-screen overlays   |

### Requirements for blur to render

`backdrop-filter` only works when the element has a semi-transparent background. Without a background the blur has no visible effect.

```css
/* Correct — semi-transparent background + blur */
background: var(--canopy-ds-color-surface-surface-glass);
backdrop-filter: blur(var(--canopy-ds-blur-md));
-webkit-backdrop-filter: blur(var(--canopy-ds-blur-md));
```

Always include both `-webkit-backdrop-filter` and `backdrop-filter` for Safari compatibility.

---

## Elevation Tokens

Three elevation levels, each with two shadow layers (`a` = primary, `b` = ambient). Values are in `px` (no rem conversion). Theme-agnostic (shadows do not change between dark and light).

### Level 1 — Subtle lift (cards, floating elements)

| Property         | Layer | CSS Variable                                        | Value        |
|------------------|-------|-----------------------------------------------------|--------------|
| color            | a     | `--canopy-ds-elevation-1-a-color`                    | #00000033    |
| offset-x         | a     | `--canopy-ds-elevation-1-a-offset-x`                 | 0px          |
| offset-y         | a     | `--canopy-ds-elevation-1-a-offset-y`                 | 2px          |
| blur             | a     | `--canopy-ds-elevation-1-a-blur`                     | 8px          |
| spread           | a     | `--canopy-ds-elevation-1-a-spread`                   | 0px          |
| color            | b     | `--canopy-ds-elevation-1-b-color`                    | #00000014    |
| offset-x         | b     | `--canopy-ds-elevation-1-b-offset-x`                 | 0px          |
| offset-y         | b     | `--canopy-ds-elevation-1-b-offset-y`                 | 1px          |
| blur             | b     | `--canopy-ds-elevation-1-b-blur`                     | 2px          |
| spread           | b     | `--canopy-ds-elevation-1-b-spread`                   | 0px          |

### Level 2 — Floating panels (dropdowns, tooltips, menus)

| Property         | Layer | CSS Variable                                        | Value        |
|------------------|-------|-----------------------------------------------------|--------------|
| color            | a     | `--canopy-ds-elevation-2-a-color`                    | #00000052    |
| offset-x         | a     | `--canopy-ds-elevation-2-a-offset-x`                 | 0px          |
| offset-y         | a     | `--canopy-ds-elevation-2-a-offset-y`                 | 8px          |
| blur             | a     | `--canopy-ds-elevation-2-a-blur`                     | 20px         |
| spread           | a     | `--canopy-ds-elevation-2-a-spread`                   | -2px         |
| color            | b     | `--canopy-ds-elevation-2-b-color`                    | #0000001f    |
| offset-x         | b     | `--canopy-ds-elevation-2-b-offset-x`                 | 0px          |
| offset-y         | b     | `--canopy-ds-elevation-2-b-offset-y`                 | 2px          |
| blur             | b     | `--canopy-ds-elevation-2-b-blur`                     | 6px          |
| spread           | b     | `--canopy-ds-elevation-2-b-spread`                   | 0px          |

### Level 3 — High elevation (modals, dialogs)

| Property         | Layer | CSS Variable                                        | Value        |
|------------------|-------|-----------------------------------------------------|--------------|
| color            | a     | `--canopy-ds-elevation-3-a-color`                    | #0000007a    |
| offset-x         | a     | `--canopy-ds-elevation-3-a-offset-x`                 | 0px          |
| offset-y         | a     | `--canopy-ds-elevation-3-a-offset-y`                 | 20px         |
| blur             | a     | `--canopy-ds-elevation-3-a-blur`                     | 40px         |
| spread           | a     | `--canopy-ds-elevation-3-a-spread`                   | -4px         |
| color            | b     | `--canopy-ds-elevation-3-b-color`                    | #0000002e    |
| offset-x         | b     | `--canopy-ds-elevation-3-b-offset-x`                 | 0px          |
| offset-y         | b     | `--canopy-ds-elevation-3-b-offset-y`                 | 4px          |
| blur             | b     | `--canopy-ds-elevation-3-b-blur`                     | 10px         |
| spread           | b     | `--canopy-ds-elevation-3-b-spread`                   | 0px          |

---

## CSS Usage

### Full two-layer box-shadow

```css
/* Level 1 — always use both layers together */
box-shadow:
  var(--canopy-ds-elevation-1-a-offset-x) var(--canopy-ds-elevation-1-a-offset-y)
  var(--canopy-ds-elevation-1-a-blur) var(--canopy-ds-elevation-1-a-spread)
  var(--canopy-ds-elevation-1-a-color),
  var(--canopy-ds-elevation-1-b-offset-x) var(--canopy-ds-elevation-1-b-offset-y)
  var(--canopy-ds-elevation-1-b-blur) var(--canopy-ds-elevation-1-b-spread)
  var(--canopy-ds-elevation-1-b-color);
```

### Combining elevation with glass highlight insets

Glass surfaces typically combine elevation with inset highlight lines from border tokens:

```css
box-shadow:
  /* Elevation (external) */
  var(--canopy-ds-elevation-1-a-offset-x) var(--canopy-ds-elevation-1-a-offset-y)
  var(--canopy-ds-elevation-1-a-blur) var(--canopy-ds-elevation-1-a-spread)
  var(--canopy-ds-elevation-1-a-color),
  var(--canopy-ds-elevation-1-b-offset-x) var(--canopy-ds-elevation-1-b-offset-y)
  var(--canopy-ds-elevation-1-b-blur) var(--canopy-ds-elevation-1-b-spread)
  var(--canopy-ds-elevation-1-b-color),
  /* Glass highlight insets (top + bottom edges) */
  inset 0 1px 0 var(--canopy-ds-color-border-border-glass-highlight),
  inset 0 -1px 0 var(--canopy-ds-color-border-border-glass-highlight);
```

---

## Canonical Glassmorphism Recipe

This is the complete, correct pattern for any frosted/glass surface in the design system.

```css
.glassSurface {
  /* Semi-transparent fill — the blur has nothing to show without this */
  background: var(--canopy-ds-color-surface-surface-glass);

  /* Backdrop blur — the defining feature */
  backdrop-filter: blur(var(--canopy-ds-blur-md));
  -webkit-backdrop-filter: blur(var(--canopy-ds-blur-md));

  /* External shadow + glass highlight insets */
  box-shadow:
    var(--canopy-ds-elevation-1-a-offset-x) var(--canopy-ds-elevation-1-a-offset-y)
    var(--canopy-ds-elevation-1-a-blur) var(--canopy-ds-elevation-1-a-spread)
    var(--canopy-ds-elevation-1-a-color),
    var(--canopy-ds-elevation-1-b-offset-x) var(--canopy-ds-elevation-1-b-offset-y)
    var(--canopy-ds-elevation-1-b-blur) var(--canopy-ds-elevation-1-b-spread)
    var(--canopy-ds-elevation-1-b-color),
    inset 0 1px 0 var(--canopy-ds-color-border-border-glass-highlight),
    inset 0 -1px 0 var(--canopy-ds-color-border-border-glass-highlight);

  /* Outer glass edge */
  border: 1px solid var(--canopy-ds-color-border-border-glass);
}
```

### Disabled glass state

Remove blur on disabled glass elements — blurring a disabled surface creates visual noise without function.

```css
.glassSurface:disabled,
.glassSurface.disabled {
  opacity: 0.4;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

### Scaling on interaction (glass buttons)

```css
.glassSurface:active:not(:disabled):not(.disabled) {
  transform: scale(0.92);
  transition: transform var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out);
}
```

---

## When to use each blur level

| Scenario                              | Blur level |
|---------------------------------------|------------|
| Header / persistent navigation bar    | `blur-md`  |
| Floating action buttons (GlassButton) | `blur-md`  |
| Tooltip / popover overlay             | `blur-sm`  |
| Modal / dialog backdrop               | `blur-lg`  |
| Full-screen loading overlay           | `blur-lg`  |
| Subtle card hover state               | `blur-sm`  |

---

## Do / Don't

| Do | Don't |
|---|---|
| Always pair `backdrop-filter: blur()` with a semi-transparent background | Apply blur without `surface-glass` — the blur has nothing to render |
| Include both `backdrop-filter` and `-webkit-backdrop-filter` | Omit the `-webkit-` prefix — Safari requires it |
| Use both `a` and `b` elevation layers together | Use a single shadow layer when the design calls for elevation |
| Remove `backdrop-filter` on disabled glass elements | Leave blur active on disabled states — it creates visual noise |
| Use `blur-md` for standard glass surfaces (headers, buttons) | Use `blur-lg` on small controls — it's too heavy |

```css
/* Do: complete glassmorphism recipe */
.glassCard {
  background: var(--canopy-ds-color-surface-surface-glass);
  backdrop-filter: blur(var(--canopy-ds-blur-md));
  -webkit-backdrop-filter: blur(var(--canopy-ds-blur-md));
  border: 1px solid var(--canopy-ds-color-border-border-glass);
}

/* Don't: blur without semi-transparent background */
.glassCard {
  backdrop-filter: blur(12px);     /* no background — blur is invisible */
  border: 1px solid rgba(255,255,255,0.16);  /* hardcoded — not a token */
}
```

```css
/* Do: both elevation layers + disabled state cleanup */
.card {
  box-shadow:
    var(--canopy-ds-elevation-1-a-offset-x) var(--canopy-ds-elevation-1-a-offset-y)
    var(--canopy-ds-elevation-1-a-blur) var(--canopy-ds-elevation-1-a-spread)
    var(--canopy-ds-elevation-1-a-color),
    var(--canopy-ds-elevation-1-b-offset-x) var(--canopy-ds-elevation-1-b-offset-y)
    var(--canopy-ds-elevation-1-b-blur) var(--canopy-ds-elevation-1-b-spread)
    var(--canopy-ds-elevation-1-b-color);
}

/* Don't: single layer or raw shadow value */
.card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);  /* raw value — not a token */
}
```
