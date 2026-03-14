# Spacing & Radius Tokens — Canopy Design System

> Source of truth: `tokens/semantic-tokens.json` → Spacing and Radius collections.
> Spacing CSS pattern: `--canopy-ds-spacing-<token>`
> Radius CSS pattern: `--canopy-ds-radius-<token>`

All spacing and radius values reference primitives (`$ref`) and are converted from `px` to `rem` at build time (base 16). Values in the tables below show the source `px` and resulting `rem`.

---

## Spacing Tokens

Two categories: **layout spacing** (3xs–5xl) for gaps, margins, and padding between elements; **component spacing** (component-sm/md/lg/xl) for inner padding within components.

### Layout spacing scale

| Token   | CSS Variable                    | px  | rem     | Use for                                        |
|---------|---------------------------------|-----|---------|------------------------------------------------|
| `none`  | `--canopy-ds-spacing-none`       | 0   | 0       | Explicit zero                                  |
| `3xs`   | `--canopy-ds-spacing-3xs`        | 2   | 0.125   | Hairline gaps, tight icon-to-label spacing     |
| `2xs`   | `--canopy-ds-spacing-2xs`        | 4   | 0.25    | Tight internal gaps (icon + badge)             |
| `xs`    | `--canopy-ds-spacing-xs`         | 8   | 0.5     | Small gaps between related elements            |
| `sm`    | `--canopy-ds-spacing-sm`         | 12  | 0.75    | Compact padding, dense list items              |
| `md`    | `--canopy-ds-spacing-md`         | 16  | 1       | Default spacing unit; most padding/gap usage   |
| `lg`    | `--canopy-ds-spacing-lg`         | 24  | 1.5     | Section padding, card gutters                  |
| `xl`    | `--canopy-ds-spacing-xl`         | 32  | 2       | Larger section padding, between major blocks   |
| `2xl`   | `--canopy-ds-spacing-2xl`        | 40  | 2.5     | Page section gaps                              |
| `3xl`   | `--canopy-ds-spacing-3xl`        | 64  | 4       | Large visual separation between page sections  |
| `4xl`   | `--canopy-ds-spacing-4xl`        | 96  | 6       | Hero padding, large section tops/bottoms       |
| `5xl`   | `--canopy-ds-spacing-5xl`        | 128 | 8       | Maximum vertical rhythm spacing                |

### Component inner padding scale

These are for `padding-inline` / `padding-block` inside interactive components (buttons, inputs, chips). They follow the design's intent for component sizing rather than layout spacing.

| Token          | CSS Variable                         | px  | rem  | Use for                                |
|----------------|--------------------------------------|-----|------|----------------------------------------|
| `component-sm` | `--canopy-ds-spacing-component-sm`    | 6   | 0.375 | Small / compact component padding     |
| `component-md` | `--canopy-ds-spacing-component-md`    | 10  | 0.625 | Medium component padding              |
| `component-lg` | `--canopy-ds-spacing-component-lg`    | 12  | 0.75  | Large component padding               |
| `component-xl` | `--canopy-ds-spacing-component-xl`    | 16  | 1     | Extra-large / full-size component padding |

### When to use layout vs component spacing

- **Layout spacing (`xs`–`5xl`)** — gaps between components, page margins, section padding, flex/grid gaps.
- **Component spacing (`component-*`)** — inner `padding` on the component itself (button padding, input padding). These are scoped to components that exist in the design as fixed-size variants.

```css
/* Layout: gap between items in a list */
gap: var(--canopy-ds-spacing-xs);

/* Layout: padding around a section */
padding-block: var(--canopy-ds-spacing-xl);
padding-inline: var(--canopy-ds-spacing-lg);

/* Component: inner button padding */
padding-inline: var(--canopy-ds-spacing-component-xl);
padding-block: var(--canopy-ds-spacing-component-lg);
```

---

## Radius Tokens

| Token   | CSS Variable                  | px   | rem    | Use for                                          |
|---------|-------------------------------|------|--------|--------------------------------------------------|
| `none`  | `--canopy-ds-radius-none`      | 0    | 0      | Sharp corners; tabular data, code blocks         |
| `2xs`   | `--canopy-ds-radius-2xs`       | 2    | 0.125  | Minimal rounding; small labels, tags             |
| `xs`    | `--canopy-ds-radius-xs`        | 4    | 0.25   | Compact elements; small chips, badges            |
| `sm`    | `--canopy-ds-radius-sm`        | 8    | 0.5    | Inputs, small cards, secondary interactive elements |
| `md`    | `--canopy-ds-radius-md`        | 12   | 0.75   | Standard cards, panels, dialogs                  |
| `lg`    | `--canopy-ds-radius-lg`        | 16   | 1      | Large cards, modals, prominent panels            |
| `xl`    | `--canopy-ds-radius-xl`        | 24   | 1.5    | Hero sections, feature cards                     |
| `2xl`   | `--canopy-ds-radius-2xl`       | 32   | 2      | Large decorative panels                          |
| `round` | `--canopy-ds-radius-round`     | 9999 | 624.9  | Pills, circular elements (avatars, icon buttons) |

```css
/* Standard card */
border-radius: var(--canopy-ds-radius-md);

/* Small badge */
border-radius: var(--canopy-ds-radius-xs);

/* Pill button or avatar */
border-radius: var(--canopy-ds-radius-round);

/* Input field */
border-radius: var(--canopy-ds-radius-sm);
```

---

## Common patterns

### Card with internal padding

```css
.card {
  border-radius: var(--canopy-ds-radius-md);
  padding: var(--canopy-ds-spacing-lg);
  gap: var(--canopy-ds-spacing-md);
}
```

### List with item gaps

```css
.list {
  display: flex;
  flex-direction: column;
  gap: var(--canopy-ds-spacing-xs);
}
```

### Section layout

```css
.section {
  padding-block: var(--canopy-ds-spacing-3xl);
  padding-inline: var(--canopy-ds-spacing-xl);
}

.sectionHeader {
  margin-block-end: var(--canopy-ds-spacing-lg);
}
```

### Inline badge / pill

```css
.badge {
  padding-inline: var(--canopy-ds-spacing-xs);
  padding-block: var(--canopy-ds-spacing-3xs);
  border-radius: var(--canopy-ds-radius-round);
}
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `--canopy-ds-spacing-*` for all gaps, margins, and padding | Write raw pixel values like `16px`, `24px`, `8px` |
| Use `--canopy-ds-radius-*` for all `border-radius` | Write `border-radius: 12px` or `border-radius: 50%` |
| Use `component-*` spacing for inner button/input padding | Use layout spacing tokens (`md`, `lg`) inside interactive components |
| Use `radius-round` for pills and circular elements | Use `border-radius: 50%` (breaks pill shape on wide content) |
| Use `spacing-none` for an explicit zero | Use `0` directly (valid, but prefer the token for searchability) |

```css
/* Do: spacing and radius tokens */
.card {
  padding: var(--canopy-ds-spacing-lg);
  gap: var(--canopy-ds-spacing-md);
  border-radius: var(--canopy-ds-radius-md);
}

/* Don't: raw values */
.card {
  padding: 24px;
  gap: 16px;
  border-radius: 12px;
}
```

```css
/* Do: component spacing for button inner padding */
.button {
  padding-inline: var(--canopy-ds-spacing-component-xl);
  padding-block: var(--canopy-ds-spacing-component-lg);
}

/* Don't: layout spacing inside a button */
.button {
  padding: var(--canopy-ds-spacing-md);  /* uses layout token — wrong category */
}
```
