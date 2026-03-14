# Color Tokens — Canopy Design System

> Source of truth: `tokens/semantic-tokens.json` → Themes collection.
> CSS variable pattern: `--canopy-ds-color-<category>-<token>`
> Note: `text&icon` becomes `text-icon` in CSS variable names.

## How Color Tokens Work

All color tokens are semantic. They have separate dark and light values resolved at build time. Dark is default (`:root`); light overrides apply under `[data-theme="light"]`. Never reference primitive color tokens (e.g. `--canopy-ds-phthalo-green-40`) directly — always use semantic names.

---

## action — Interactive element backgrounds

Use for button fills, CTA backgrounds, and any element whose background communicates an action or intent.

| Token                       | CSS Variable                                              | Dark ref          | Light ref         |
|-----------------------------|-----------------------------------------------------------|-------------------|-------------------|
| `action-primary`            | `--canopy-ds-color-action-action-primary`                  | phthalo-green-40           | phthalo-green-70           |
| `action-primary-hover`      | `--canopy-ds-color-action-action-primary-hover`            | phthalo-green-50           | phthalo-green-60           |
| `action-primary-pressed`    | `--canopy-ds-color-action-action-primary-pressed`          | phthalo-green-60           | phthalo-green-50           |
| `action-secondary`          | `--canopy-ds-color-action-action-secondary`                | white-a04         | black-a04         |
| `action-secondary-hover`    | `--canopy-ds-color-action-action-secondary-hover`          | white-a08         | black-a08         |
| `action-secondary-pressed`  | `--canopy-ds-color-action-action-secondary-pressed`        | white-a12         | black-a12         |
| `action-tertiary`           | `--canopy-ds-color-action-action-tertiary`                 | white-a00         | white-a00         |
| `action-tertiary-hover`     | `--canopy-ds-color-action-action-tertiary-hover`           | white-a04         | black-a04         |
| `action-tertiary-pressed`   | `--canopy-ds-color-action-action-tertiary-pressed`         | white-a08         | black-a08         |
| `action-critical`           | `--canopy-ds-color-action-action-critical`                 | red-70            | red-70            |
| `action-critical-hover`     | `--canopy-ds-color-action-action-critical-hover`           | red-60            | red-60            |
| `action-critical-pressed`   | `--canopy-ds-color-action-action-critical-pressed`         | red-50            | red-50            |
| `action-caution`            | `--canopy-ds-color-action-action-caution`                  | yellow-40         | yellow-60         |
| `action-caution-hover`      | `--canopy-ds-color-action-action-caution-hover`            | yellow-50         | yellow-50         |
| `action-caution-pressed`    | `--canopy-ds-color-action-action-caution-pressed`          | yellow-60         | yellow-40         |
| `action-disabled`           | `--canopy-ds-color-action-action-disabled`                 | white-a04         | black-a04         |

### Usage

```css
/* Primary CTA */
background: var(--canopy-ds-color-action-action-primary);

/* Secondary ghost button */
background: var(--canopy-ds-color-action-action-secondary);

/* Hover state */
background: var(--canopy-ds-color-action-action-primary-hover);
```

---

## border — Borders, dividers, outlines

Use for all visual separators. `border-glass` and `border-glass-highlight` are for glassmorphism surfaces.

| Token                   | CSS Variable                                          | Dark ref   | Light ref  |
|-------------------------|-------------------------------------------------------|------------|------------|
| `border-default`        | `--canopy-ds-color-border-border-default`              | grey-70    | grey-20    |
| `border-deselected`     | `--canopy-ds-color-border-border-deselected`           | grey-70    | grey-20    |
| `border-divider`        | `--canopy-ds-color-border-border-divider`              | grey-90    | grey-20    |
| `border-medium`         | `--canopy-ds-color-border-border-medium`               | grey-60    | grey-30    |
| `border-strong`         | `--canopy-ds-color-border-border-strong`               | white      | black      |
| `border-primary`        | `--canopy-ds-color-border-border-primary`              | phthalo-green-40    | phthalo-green-70    |
| `border-selected`       | `--canopy-ds-color-border-border-selected`             | phthalo-green-40    | phthalo-green-70    |
| `border-glass`          | `--canopy-ds-color-border-border-glass`                | white-a16  | black-a08  |
| `border-glass-highlight`| `--canopy-ds-color-border-border-glass-highlight`      | white-a16  | white      |
| `border-level`          | `--canopy-ds-color-border-border-level`                | white-a00  | grey-20    |
| `border-secondary`      | `--canopy-ds-color-border-border-secondary`            | white-a00  | white-a00  |
| `border-tertiary`       | `--canopy-ds-color-border-border-tertiary`             | grey-70    | grey-20    |
| `border-caution`        | `--canopy-ds-color-border-border-caution`              | yellow-40  | yellow-70  |
| `border-critical`       | `--canopy-ds-color-border-border-critical`             | red-40     | red-70     |
| `border-info`           | `--canopy-ds-color-border-border-info`                 | blue-40    | blue-70    |
| `border-success`        | `--canopy-ds-color-border-border-success`              | green-40   | green-70   |

### Usage

```css
border: 1px solid var(--canopy-ds-color-border-border-default);
border-bottom: 1px solid var(--canopy-ds-color-border-border-divider);

/* Focus ring */
outline: 3px solid var(--canopy-ds-color-border-border-strong);

/* Glass edge */
border: 1px solid var(--canopy-ds-color-border-border-glass);
/* Glass highlight top edge */
box-shadow: inset 0 1px 0 var(--canopy-ds-color-border-border-glass-highlight);
```

---

## surface — Background fills

Use for element backgrounds. `surface-base` is the page background. `surface-glass` is for frosted/glass surfaces.

| Token                      | CSS Variable                                            | Dark ref   | Light ref   |
|----------------------------|---------------------------------------------------------|------------|-------------|
| `surface-base`             | `--canopy-ds-color-surface-surface-base`                 | grey-90    | white       |
| `surface-level-1`          | `--canopy-ds-color-surface-surface-level-1`              | grey-85    | white       |
| `surface-level-1-alt`      | `--canopy-ds-color-surface-surface-level-1-alt`          | grey-85    | grey-05     |
| `surface-level-2`          | `--canopy-ds-color-surface-surface-level-2`              | grey-80    | white       |
| `surface-level-2-alt`      | `--canopy-ds-color-surface-surface-level-2-alt`          | grey-80    | grey-10     |
| `surface-recessed`         | `--canopy-ds-color-surface-surface-recessed`             | black      | grey-05     |
| `surface-invert`           | `--canopy-ds-color-surface-surface-invert`               | grey-05    | grey-90     |
| `surface-glass`            | `--canopy-ds-color-surface-surface-glass`                | white-a04  | white-a64   |
| `surface-accent`           | `--canopy-ds-color-surface-surface-accent`               | phthalo-green-40    | phthalo-green-40     |
| `surface-accent-subdued`   | `--canopy-ds-color-surface-surface-accent-subdued`       | phthalo-green-a16   | phthalo-green-a12    |
| `surface-brand`            | `--canopy-ds-color-surface-surface-brand`                | phthalo-green-40    | phthalo-green-40     |
| `surface-brand-subdued`    | `--canopy-ds-color-surface-surface-brand-subdued`        | phthalo-green-a16   | phthalo-green-a12    |
| `surface-disabled`         | `--canopy-ds-color-surface-surface-disabled`             | white-a08  | black-a04   |
| `surface-caution`          | `--canopy-ds-color-surface-surface-caution`              | yellow-70  | yellow-40   |
| `surface-caution-subdued`  | `--canopy-ds-color-surface-surface-caution-subdued`      | yellow-a16 | yellow-a08  |
| `surface-critical`         | `--canopy-ds-color-surface-surface-critical`             | red-70     | red-40      |
| `surface-critical-subdued` | `--canopy-ds-color-surface-surface-critical-subdued`     | red-a16    | red-a08     |
| `surface-info`             | `--canopy-ds-color-surface-surface-info`                 | blue-70    | blue-40     |
| `surface-info-subdued`     | `--canopy-ds-color-surface-surface-info-subdued`         | blue-a16   | blue-a08    |
| `surface-success`          | `--canopy-ds-color-surface-surface-success`              | green-70   | green-40    |
| `surface-success-subdued`  | `--canopy-ds-color-surface-surface-success-subdued`      | green-a16  | green-a08   |

### Surface hierarchy

`recessed` → `base` → `level-1` → `level-2` (dark to light in dark mode). Use in order when nesting surfaces.

```css
/* Page */
background: var(--canopy-ds-color-surface-surface-base);

/* Card on page */
background: var(--canopy-ds-color-surface-surface-level-1);

/* Panel inside card */
background: var(--canopy-ds-color-surface-surface-level-2);

/* Frosted overlay */
background: var(--canopy-ds-color-surface-surface-glass);
```

---

## text&icon — Text and icon colors

CSS var segment: `text-icon` (the `&` is replaced with `-` and combined). Use for all text, icon fills, and SVG strokes/fills.

| Token                           | CSS Variable                                                      | Dark ref  | Light ref |
|---------------------------------|-------------------------------------------------------------------|-----------|-----------|
| `text-default`                  | `--canopy-ds-color-text-icon-text-default`                         | grey-10   | grey-90   |
| `text-strong`                   | `--canopy-ds-color-text-icon-text-strong`                          | white     | black     |
| `text-subtle`                   | `--canopy-ds-color-text-icon-text-subtle`                          | grey-30   | grey-70   |
| `text-minimal`                  | `--canopy-ds-color-text-icon-text-minimal`                         | grey-40   | grey-60   |
| `text-disabled`                 | `--canopy-ds-color-text-icon-text-disabled`                        | grey-60   | grey-40   |
| `text-deselected`               | `--canopy-ds-color-text-icon-text-deselected`                      | grey-40   | grey-60   |
| `text-invert`                   | `--canopy-ds-color-text-icon-text-invert`                          | grey-90   | grey-05   |
| `text-selected`                 | `--canopy-ds-color-text-icon-text-selected`                        | white     | black     |
| `text-brand`                    | `--canopy-ds-color-text-icon-text-brand`                           | phthalo-green-40   | phthalo-green-70   |
| `text-interactive`              | `--canopy-ds-color-text-icon-text-interactive`                     | phthalo-green-40   | phthalo-green-70   |
| `text-interactive-hover`        | `--canopy-ds-color-text-icon-text-interactive-hover`               | phthalo-green-50   | phthalo-green-60   |
| `text-interactive-pressed`      | `--canopy-ds-color-text-icon-text-interactive-pressed`             | phthalo-green-60   | phthalo-green-50   |
| `text-interactive-subdued`      | `--canopy-ds-color-text-icon-text-interactive-subdued`             | grey-05   | grey-90   |
| `text-on-primary`               | `--canopy-ds-color-text-icon-text-on-primary`                      | black     | white     |
| `text-on-secondary`             | `--canopy-ds-color-text-icon-text-on-secondary`                    | phthalo-green-40   | phthalo-green-70   |
| `text-on-tertiary`              | `--canopy-ds-color-text-icon-text-on-tertiary`                     | phthalo-green-40   | phthalo-green-70   |
| `text-caution`                  | `--canopy-ds-color-text-icon-text-caution`                         | yellow-40 | yellow-70 |
| `text-critical`                 | `--canopy-ds-color-text-icon-text-critical`                        | red-40    | red-70    |
| `text-info`                     | `--canopy-ds-color-text-icon-text-info`                            | blue-40   | blue-70   |
| `text-success`                  | `--canopy-ds-color-text-icon-text-success`                         | green-40  | green-70  |
| `text-xp`                       | `--canopy-ds-color-text-icon-text-xp`                              | phthalo-green-20*  | phthalo-green-60   |

### Usage

```css
color: var(--canopy-ds-color-text-icon-text-default);
color: var(--canopy-ds-color-text-icon-text-subtle);

/* On a primary (phthalo-green) button */
color: var(--canopy-ds-color-text-icon-text-on-primary);
```

---

## decoration — Non-interactive color accents

Use for badges, pills, highlights, status indicators, and other colored accents that are not interactive.

| Token                        | CSS Variable                                                  | Dark ref   | Light ref  |
|------------------------------|---------------------------------------------------------------|------------|------------|
| `decoration-phthalo-green`            | `--canopy-ds-color-decoration-decoration-phthalo-green`                 | phthalo-green-40    | phthalo-green-70    |
| `decoration-phthalo-green-subtle`     | `--canopy-ds-color-decoration-decoration-phthalo-green-subtle`          | phthalo-green-a16   | phthalo-green-a08   |
| `decoration-blue`            | `--canopy-ds-color-decoration-decoration-blue`                 | blue-40    | blue-70    |
| `decoration-blue-subtle`     | `--canopy-ds-color-decoration-decoration-blue-subtle`          | blue-a16   | blue-a08   |
| `decoration-green`           | `--canopy-ds-color-decoration-decoration-green`                | green-40   | green-70   |
| `decoration-green-subtle`    | `--canopy-ds-color-decoration-decoration-green-subtle`         | green-a16  | green-a08  |
| `decoration-red`             | `--canopy-ds-color-decoration-decoration-red`                  | red-40     | red-70     |
| `decoration-red-subtle`      | `--canopy-ds-color-decoration-decoration-red-subtle`           | red-a16    | red-a08    |
| `decoration-yellow`          | `--canopy-ds-color-decoration-decoration-yellow`               | yellow-40  | yellow-70  |
| `decoration-yellow-subtle`   | `--canopy-ds-color-decoration-decoration-yellow-subtle`        | yellow-a16 | yellow-a08 |

---

## interactive — Generic hover/press fills

Use for hover and press state fills on non-button interactive elements (list items, menu rows, cards that respond to hover).

| Token                          | CSS Variable                                                      | Dark ref  | Light ref  |
|--------------------------------|-------------------------------------------------------------------|-----------|------------|
| `interactive-default`          | `--canopy-ds-color-interactive-interactive-default`                | white-a04 | black-a04  |
| `interactive-default-hover`    | `--canopy-ds-color-interactive-interactive-default-hover`          | white-a08 | black-a08  |
| `interactive-default-pressed`  | `--canopy-ds-color-interactive-interactive-default-pressed`        | white-a12 | black-a12  |
| `interactive-default-selected` | `--canopy-ds-color-interactive-interactive-default-selected`       | phthalo-green-a16  | phthalo-green-a08   |
| `interactive-strong`           | `--canopy-ds-color-interactive-interactive-strong`                 | phthalo-green-a16  | phthalo-green-a08   |
| `interactive-strong-hover`     | `--canopy-ds-color-interactive-interactive-strong-hover`           | phthalo-green-a24  | phthalo-green-a12   |
| `interactive-strong-pressed`   | `--canopy-ds-color-interactive-interactive-strong-pressed`         | phthalo-green-a32  | phthalo-green-a16   |
| `interactive-strong-selected`  | `--canopy-ds-color-interactive-interactive-strong-selected`        | phthalo-green-40   | phthalo-green-70    |
| `interactive-subdued`          | `--canopy-ds-color-interactive-interactive-subdued`                | white-a00 | white-a00  |
| `interactive-subdued-hover`    | `--canopy-ds-color-interactive-interactive-subdued-hover`          | white-a04 | black-a04  |
| `interactive-subdued-pressed`  | `--canopy-ds-color-interactive-interactive-subdued-pressed`        | white-a08 | black-a08  |
| `interactive-focused`          | `--canopy-ds-color-interactive-interactive-focused`                | white-a12 | black-a12  |
| `interactive-disabled`         | `--canopy-ds-color-interactive-interactive-disabled`               | white-a04 | black-a02  |

---

## overlay — Scrim and backdrop fills

Use for modal backdrops, drawer scrims, and full-screen overlays.

| Token              | CSS Variable                                       | Dark ref      | Light ref     |
|--------------------|----------------------------------------------------|---------------|---------------|
| `overlay`          | `--canopy-ds-color-overlay-overlay`                 | black-a48     | black-a40     |
| `overlay-strong`   | `--canopy-ds-color-overlay-overlay-strong`          | grey-90-a40   | white-a40     |

```css
background: var(--canopy-ds-color-overlay-overlay);
```

---

## fade — Gradient fade colors

Transparent-to-surface colors for scroll fades, content masks, and edge gradients. Always use as one stop in a gradient (the `a00` value makes the starting color fully transparent).

| Token                    | CSS Variable                                           |
|--------------------------|--------------------------------------------------------|
| `fade-base`              | `--canopy-ds-color-fade-fade-base`                      |
| `fade-base-level-1`      | `--canopy-ds-color-fade-fade-base-level-1`              |
| `fade-base-level-1-alt`  | `--canopy-ds-color-fade-fade-base-level-1-alt`          |
| `fade-base-level-2`      | `--canopy-ds-color-fade-fade-base-level-2`              |
| `fade-base-level-2-alt`  | `--canopy-ds-color-fade-fade-base-level-2-alt`          |

```css
/* Fade content out at the bottom of a scroll container */
background: linear-gradient(
  to bottom,
  var(--canopy-ds-color-fade-fade-base),
  var(--canopy-ds-color-surface-surface-base)
);
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Use semantic token names (`action-primary`, `surface-level-1`) | Use primitive names (`--canopy-ds-phthalo-green-40`, `--canopy-ds-grey-90`) |
| Let `data-theme` resolve values automatically | Hardcode hex values even for "obvious" colors |
| Use `action-*` tokens for button and CTA backgrounds | Use `decoration-*` or `surface-*` tokens on interactive elements |
| Use `text-icon-text-on-primary` for text on a primary (phthalo-green) button | Use `text-default` on a primary button — it's the wrong contrast token |
| Use `surface-level-1` → `level-2` in order when nesting surfaces | Skip levels (e.g. `level-1` inside `level-1`) — creates flat, undifferentiated depth |

```css
/* Do: semantic token, theme-aware */
background: var(--canopy-ds-color-action-action-primary);
color: var(--canopy-ds-color-text-icon-text-on-primary);

/* Don't: hardcoded primitive */
background: #4fffbb;   /* phthalo-green-40 */
color: #000000;
```

```css
/* Do: correct surface hierarchy */
.page     { background: var(--canopy-ds-color-surface-surface-base); }
.card     { background: var(--canopy-ds-color-surface-surface-level-1); }
.subPanel { background: var(--canopy-ds-color-surface-surface-level-2); }

/* Don't: same surface token at every level — loses depth */
.page     { background: var(--canopy-ds-color-surface-surface-level-1); }
.card     { background: var(--canopy-ds-color-surface-surface-level-1); }
.subPanel { background: var(--canopy-ds-color-surface-surface-level-1); }
```
