# Layout Patterns — Canopy Design System

> Components: `Container`, `Grid` from `@canopy-ds/react`.
> Source: `packages/react/src/Layout/`.
> Token dependency: `--canopy-ds-layout-<breakpoint>-<property>-<breakpoint>` (e.g. `--canopy-ds-layout-lg-margin-lg`).

---

## Breakpoints

CSS variables cannot be used inside `@media (min-width: ...)` conditions. Breakpoint values are hardcoded in `Layout.module.css`. Use these exact values in any custom `@media` queries.

| Breakpoint | `min-width` | px    | rem      | Columns | Gutter | Margin |
|------------|-------------|-------|----------|---------|--------|--------|
| `xs`       | 0           | 0     | 0        | 4       | 16px   | 16px   |
| `sm`       | 37.5rem     | 600px | 37.5rem  | 8       | 24px   | 32px   |
| `md`       | 56.25rem    | 900px | 56.25rem | 12      | 24px   | 32px   |
| `lg`       | 75rem       | 1200px| 75rem    | 12      | 24px   | 32px   |
| `xl`       | 96rem       | 1536px| 96rem    | 12      | 24px   | 32px   |

Container max-width caps at `xl` only (1440px / 90rem). At all smaller breakpoints the container is fluid (full width minus margins).

---

## Container

Constrains horizontal layout with responsive margin/padding from layout tokens. Fluid up to `xl`, then centers with a `max-width`.

### Import

```jsx
import { Container } from "@canopy-ds/react";
```

### Props

| Prop        | Type                          | Default | Description               |
|-------------|-------------------------------|---------|---------------------------|
| `as`        | `keyof JSX.IntrinsicElements` | `"div"` | HTML element to render as |
| `className` | `string`                      | —       | Additional classes        |
| `children`  | `React.ReactNode`             | —       |                           |

### Usage

```jsx
<Container>
  {/* content */}
</Container>

/* As a section element */
<Container as="section">
  {/* content */}
</Container>
```

### What it does

- `xs` (0–599px): `padding-inline: 1rem` (16px / `--canopy-ds-layout-xs-margin-xs`)
- `sm`+ (600px+): `padding-inline: 2rem` (32px / `--canopy-ds-layout-sm-margin-sm`)
- `lg`+ (1200px+): `padding-inline: 2rem` (32px / `--canopy-ds-layout-lg-margin-lg`)
- `xl`+ (1536px+): `max-width: 90rem` (1440px), `padding-inline: 2rem`

---

## Grid

12-column CSS Grid with responsive columns and gutters from layout tokens.

### Import

```jsx
import { Grid } from "@canopy-ds/react";
```

### Props

Same as `Container` — `as`, `className`, `children`.

### Column counts

- `xs` (0–599px): **4 columns**, `gap: 1rem`
- `sm` (600–899px): **8 columns**, `gap: 1.5rem`
- `md`+ (900px+): **12 columns**, `gap: 1.5rem`

### Usage

```jsx
import { Container, Grid } from "@canopy-ds/react";

<Container>
  <Grid>
    <div className={styles.spanLg8}>Main content</div>
    <div className={styles.spanLg4}>Sidebar</div>
  </Grid>
</Container>
```

---

## Span Helpers

Grid children use span helper classes from `Layout.module.css` (imported into the consuming component's module with `composes` or passed as `className`).

### Always-on spans (all breakpoints)

```css
.span1  { grid-column: span 1; }
.span2  { grid-column: span 2; }
.span3  { grid-column: span 3; }
.span4  { grid-column: span 4; }
.span6  { grid-column: span 6; }
.span8  { grid-column: span 8; }
.span12 { grid-column: span 12; }
```

### Responsive spans (md+ and lg+ only)

```css
/* md+ — 900px = 56.25rem */
.spanMd6  { grid-column: span 6; }
.spanMd12 { grid-column: span 12; }

/* lg+ — 1200px = 75rem */
.spanLg4  { grid-column: span 4; }
.spanLg6  { grid-column: span 6; }
.spanLg8  { grid-column: span 8; }
.spanLg12 { grid-column: span 12; }
```

### Accessing span classes in a component

Because span classes live in `Layout.module.css`, access them via the design system's export or reference them with a global composes:

**Option A — Pass directly as className (when using Grid in the same file)**

```jsx
import styles from "./Layout.module.css";

<Grid>
  <div className={styles.spanLg8}>Main</div>
  <div className={styles.spanLg4}>Aside</div>
</Grid>
```

**Option B — Compose in your module**

```css
/* MyComponent.module.css */
.mainColumn {
  composes: spanLg8 from "@canopy-ds/react/src/Layout/Layout.module.css";
}
```

---

## Common Layout Recipes

### Two-column: 8/4 split at lg+

```jsx
<Container>
  <Grid>
    <div className={styles.spanLg8}>
      {/* Main content */}
    </div>
    <div className={styles.spanLg4}>
      {/* Sidebar / metadata */}
    </div>
  </Grid>
</Container>
```

### Three-column card grid (full at md+)

```jsx
<Container>
  <Grid>
    {cards.map(card => (
      <div key={card.id} className={styles.spanMd6 + " " + styles.spanLg4}>
        <Card {...card} />
      </div>
    ))}
  </Grid>
</Container>
```

### Centered single-column content

```jsx
<Container>
  <Grid>
    <div className={styles.spanLg8} style={{ gridColumnStart: 3 }}>
      {/* Centered 8-col content — starts at col 3 on lg+ */}
    </div>
  </Grid>
</Container>
```

Or with a custom module:

```css
.centerCol {
  grid-column: 1 / -1; /* full width on mobile */
}

@media (min-width: 75rem) {
  .centerCol {
    grid-column: 3 / span 8;
  }
}
```

### Page-level layout (header + main + footer)

```jsx
<header className={styles.header}>
  <Container as="div">…</Container>
</header>

<main>
  <Container>
    <Grid>…</Grid>
  </Container>
</main>

<footer>
  <Container as="div">…</Container>
</footer>
```

---

## Custom `@media` queries

When writing custom breakpoints in a CSS module, use the hardcoded rem values from the table above. Never use CSS variables inside `@media` conditions.

```css
/* CORRECT */
@media (min-width: 56.25rem) { /* md — 900px */
  .myElement { … }
}

@media (min-width: 75rem) { /* lg — 1200px */
  .myElement { … }
}

/* WRONG — CSS vars don't work here */
@media (min-width: var(--canopy-ds-layout-lg-viewport-lg)) {
  .myElement { … }
}
```

---

## Layout Tokens (CSS Variables)

Available as CSS variables for use in element properties (not `@media`):

| Token                                    | Value  | Use for                              |
|------------------------------------------|--------|--------------------------------------|
| `--canopy-ds-layout-xs-margin-xs`         | 1rem   | Inline padding at xs                 |
| `--canopy-ds-layout-sm-margin-sm`         | 2rem   | Inline padding at sm+                |
| `--canopy-ds-layout-lg-margin-lg`         | 2rem   | Inline padding at lg+                |
| `--canopy-ds-layout-xl-margin-xl`         | 2rem   | Inline padding at xl (capped)        |
| `--canopy-ds-layout-xl-container-xl`      | 90rem  | Max-width at xl                      |
| `--canopy-ds-layout-xs-gutter-xs`         | 1rem   | Grid gap at xs                       |
| `--canopy-ds-layout-sm-gutter-sm`         | 1.5rem | Grid gap at sm+                      |
| `--canopy-ds-layout-lg-gutter-lg`         | 1.5rem | Grid gap at lg+                      |

---

## Do / Don't

| Do | Don't |
|---|---|
| Always wrap page content in `<Container>` | Set `max-width`, `padding-inline`, or `margin: 0 auto` manually on a page wrapper |
| Always nest `<Grid>` inside `<Container>` | Use `<Grid>` without a `<Container>` — margins and max-width won't apply |
| Use hardcoded rem values in `@media` queries (`75rem`, `56.25rem`) | Use CSS variables in `@media (min-width: ...)` — they don't work there |
| Use responsive span classes (`spanLg8`, `spanMd6`) for layout shifts | Hardcode `grid-column: span 8` in component CSS without a breakpoint class |
| Reach for `Container as="section"` for semantic landmark regions | Add a `<section>` around `<Container>` — creates unnecessary nesting |

```jsx
/* Do: Container wraps Grid, content uses span classes */
<Container>
  <Grid>
    <div className={styles.spanLg8}>Main</div>
    <div className={styles.spanLg4}>Aside</div>
  </Grid>
</Container>

/* Don't: manual max-width, no Container/Grid */
<div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px" }}>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)" }}>
    …
  </div>
</div>
```

```css
/* Do: hardcoded rem in media query */
@media (min-width: 75rem) {   /* lg — 1200px */
  .sidebar { display: block; }
}

/* Don't: CSS variable in media query — silently does nothing */
@media (min-width: var(--canopy-ds-layout-lg-viewport-lg)) {
  .sidebar { display: block; }
}
```
