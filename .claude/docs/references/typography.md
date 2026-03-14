# Typography — Canopy Design System

> Source of truth: `tokens/typography-tokens.json` (Figma export via Tokenator).
> Build output: `packages/tokens/dist/web/type-styles.css` (`.type-*` classes) and `typography.css`.
> Components: `<Text>` and `<Heading>` in `@canopy-ds/react`.

## How Typography Works

Typography is token-only. `.type-*` CSS classes set `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing` exclusively from CSS custom properties (e.g. `--canopy-ds-typography-body-01-font-size`). All classes also include `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, and `text-rendering: optimizeLegibility` for consistent rendering.

**Never** re-declare font properties inline in component CSS. Always use a `.type-*` class.

Fonts: **Manrope** (UI text, headings) and **Martian Mono** (monospace / code). Load via:

```jsx
import "@canopy-ds/tokens/fonts.css";
```

Or in HTML:

```html
<link rel="stylesheet" href="node_modules/@canopy-ds/tokens/fonts.css" />
```

---

## Using Type Classes

### In JSX (HTML elements)

```jsx
<span className="type-body-01">Default body text</span>
<h2 className="type-display-01">Large heading</h2>
<span className="type-label-01">Form label</span>
<code className="type-mono-01">Code value</code>
```

### In CSS Modules (composition)

```css
.heading {
  composes: type-display-01 from global;
}

.body {
  composes: type-body-01 from global;
}
```

### With design system components (preferred for semantic HTML)

```jsx
import { Text, Heading } from "@canopy-ds/react";

<Heading level={1} variant="display-01">Page title</Heading>
<Heading level={2} variant="headline-01">Section title</Heading>
<Text variant="body-01">Body content</Text>
<Text variant="label-01">Form label</Text>
```

`<Heading>` renders as the correct `<h1>`–`<h6>` element controlled by `level`, while `variant` independently controls the visual size — these are intentionally decoupled.

---

## Type Scale

Type scale classes follow the naming pattern `.type-<category>-<step>`. Steps increase in size (01 is largest within a category, or vice versa depending on convention — verify in Storybook for the current build).

### Display — Large, expressive headings

Use for hero sections, splash headings, and the largest on-screen text.

```css
.type-display-01 { /* largest display */ }
.type-display-02 { }
.type-display-03 { /* smallest display */ }
```

### Headline — Section and component headings

Use for section titles, card headings, dialog titles, and navigation labels.

```css
.type-headline-01 { /* larger headline */ }
.type-headline-02 { /* default headline — used in nav links, list headings */ }
.type-headline-03 { }
```

### Body — Prose and content text

Use for paragraphs, descriptions, list items, and any running text.

```css
.type-body-01 { /* default body — most prose text */ }
.type-body-02 { /* slightly smaller */ }
.type-body-03 { /* compact body */ }
```

### Label — UI labels and annotations

Use for form labels, input placeholders (styled), button text, tab labels, and metadata.

```css
.type-label-01 { }
.type-label-02 { }
```

### Caption — Small supplementary text

Use for timestamps, footnotes, helper text, character counts, and secondary metadata.

```css
.type-caption-01 { }
.type-caption-02 { }
```

### Mono — Monospace / code

Use for code snippets, values that benefit from fixed-width alignment (e.g. game scores, token amounts), and technical strings.

```css
.type-mono-01 { }
.type-mono-02 { }
```

---

## Rules

1. **All typography from tokens.** Never write `font-size: 14px`, `font-weight: 600`, or any font property literal in a CSS Module.

2. **Use the right semantic element.** A `.type-display-01` class on a `<span>` does not make it a heading. Use `<h1>`–`<h6>`, `<p>`, `<label>`, or the `<Heading>`/`<Text>` components.

3. **Do not override font-smoothing.** The `.type-*` classes include smoothing — don't re-declare it.

4. **Load fonts once.** Import `@canopy-ds/tokens/fonts.css` at the app entry point only, not in component files.

5. **`level` vs `variant` in `<Heading>`.** `level` controls the rendered HTML element (accessibility hierarchy). `variant` controls the visual appearance. They are independent — a level-3 heading can look like `display-01` if the design calls for it.

---

## CSS custom property names (for reference)

Typography tokens are available as CSS custom properties if you need to compose them manually (rare — prefer `.type-*` classes):

```
--canopy-ds-typography-<style>-font-size
--canopy-ds-typography-<style>-font-weight
--canopy-ds-typography-<style>-line-height
--canopy-ds-typography-<style>-letter-spacing
--canopy-ds-typography-<style>-font-family
```

Example: `--canopy-ds-typography-body-01-font-size`.

Only use these directly when building a custom component that cannot use a `.type-*` class (e.g. SVG text, canvas rendering).

---

## Do / Don't

| Do | Don't |
|---|---|
| Apply `.type-*` classes (or `<Text>`/`<Heading>`) for all text styling | Write `font-size`, `font-weight`, or `line-height` in a CSS Module |
| Use `<Heading level={n}>` for semantic heading hierarchy | Put a `type-display-01` class on a `<div>` and call it a heading |
| Decouple `level` from `variant` in `<Heading>` when design calls for it | Always match `level` and variant numerically (they are independent) |
| Import `fonts.css` once at app entry | Import `fonts.css` inside a component file |
| Use `.type-mono-*` for game scores and numeric amounts that need alignment | Use `font-family: monospace` inline |

```jsx
/* Do: semantic element + type class */
<h2 className="type-headline-01">Section title</h2>

/* Don't: wrong element, raw font property */
<div style={{ fontSize: "24px", fontWeight: 600 }}>Section title</div>
```

```jsx
/* Do: Heading component with level/variant decoupled */
<Heading level={3} variant="display-02">Feature card title</Heading>
/* Renders as <h3> but looks like a display heading — intentional */

/* Don't: conflating semantic level with visual size */
<h3 className="type-headline-03">Feature card title</h3>
/* Forces the visual size to match the hierarchy level — loses design flexibility */
```

```css
/* Do: compose type class in CSS Module */
.label {
  composes: type-label-01 from global;
  color: var(--canopy-ds-color-text-icon-text-subtle);
}

/* Don't: re-declare font properties */
.label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--canopy-ds-color-text-icon-text-subtle);
}
```
