# Theming — Canopy Design System

> Theme mechanism: `data-theme` attribute on any ancestor element.
> Token file: `packages/tokens/dist/web/variables.css` (`:root` = dark, `[data-theme="light"]` = light-only overrides).

---

## How Theming Works

Dark is the default theme. All color tokens resolve from `:root`, which contains dark values. The `[data-theme="light"]` block contains **only the tokens that differ between dark and light** — no duplication, no full override. Any token not listed in the light block keeps its dark value.

This means:
- Components need no theme-specific code.
- All CSS variables resolve correctly based on the nearest `data-theme` ancestor.
- Theming works on any subtree — you can mix themes on the same page.

---

## Applying a Theme

### Page-level (most common)

```html
<!-- Light theme -->
<html data-theme="light">

<!-- Dark theme (default — no attribute needed, but explicit is fine) -->
<html>
<!-- or -->
<html data-theme="dark">
```

### JavaScript toggle

```js
// Set light
document.documentElement.dataset.theme = "light";

// Set dark (remove attribute to return to default)
document.documentElement.removeAttribute("data-theme");
// or set explicitly
document.documentElement.dataset.theme = "dark";
```

### React state toggle

```jsx
function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
      Toggle theme
    </button>
  );
}
```

### Subtree theming (section with a different theme)

```html
<!-- Dark page with a light-themed section -->
<body>
  <header>…</header>
  <section data-theme="light">
    <!-- all tokens inside resolve to light values -->
  </section>
</body>
```

```jsx
<div data-theme="light" className={styles.lightPanel}>
  {/* tokens inside resolve to light values */}
</div>
```

---

## What Changes Between Themes

Only `color` tokens have theme variants. All other token categories are theme-agnostic:

| Token category | Themed? | Notes                                       |
|----------------|---------|---------------------------------------------|
| Color          | Yes     | All 6 categories have dark/light values     |
| Spacing        | No      | Same values in both themes                  |
| Radius         | No      | Same values in both themes                  |
| Typography     | No      | Same values in both themes                  |
| Blur           | No      | Same values in both themes                  |
| Elevation      | No      | Shadow colors are absolute, not themed      |
| Motion         | No      | Same values in both themes                  |
| Layout         | No      | Same values in both themes                  |

---

## Token Resolution

```
:root {
  --canopy-ds-color-surface-surface-base: /* dark value (grey-90) */;
  --canopy-ds-color-action-action-primary: /* dark value (mint-40) */;
  /* … all color tokens … */
}

[data-theme="light"] {
  --canopy-ds-color-surface-surface-base: /* light value (white) */;
  --canopy-ds-color-action-action-primary: /* light value (mint-70) */;
  /* … only tokens that differ … */
}
```

When you write:

```css
background: var(--canopy-ds-color-surface-surface-base);
```

The browser resolves this against the nearest ancestor's custom property scope. Under `[data-theme="light"]`, `--canopy-ds-color-surface-surface-base` is the light value.

---

## Writing Theme-Aware Components

Theme-aware components require **zero special code**. Use semantic tokens; the browser does the rest.

```css
/* CORRECT — works in both themes automatically */
.card {
  background: var(--canopy-ds-color-surface-surface-level-1);
  color: var(--canopy-ds-color-text-icon-text-default);
  border: 1px solid var(--canopy-ds-color-border-border-default);
}
```

```css
/* WRONG — hardcoded to dark */
.card {
  background: #1a1a1a;
  color: #f0f0f0;
}
```

```css
/* WRONG — manual theme check is never needed */
[data-theme="light"] .card {
  background: white;
  color: black;
}
```

---

## Loading the CSS

Import `variables.css` at your app entry point — once. This loads both the dark (`:root`) defaults and the light (`[data-theme="light"]`) overrides.

```js
import "@canopy-ds/tokens/dist/web/variables.css";
```

Or in HTML:

```html
<link rel="stylesheet" href="node_modules/@canopy-ds/tokens/dist/web/variables.css" />
```

Also import typography (separate file, not theme-sensitive):

```js
import "@canopy-ds/tokens/dist/web/typography.css";
import "@canopy-ds/tokens/dist/web/type-styles.css";
```

---

## JS/TS Token Map (Theme-Specific Access)

When you need resolved token values in JavaScript (e.g. for canvas, charting, or native mobile bridges):

```ts
import { tokens, tokensDark, tokensLight } from "@canopy-ds/tokens";

// Default (dark)
const primaryBg = tokens["color.action.action-primary"];

// Explicit
const primaryBgDark = tokensDark["color.action.action-primary"];
const primaryBgLight = tokensLight["color.action.action-primary"];
```

Type-safe key access:

```ts
import { pixelDsTokens, type PixelDsTokenKey } from "@canopy-ds/tokens";

const key: PixelDsTokenKey = "color.surface.surface-base";
const value = pixelDsTokens[key];
```

---

## SSR / Pre-rendered HTML

For server-rendered apps, resolve the user's theme preference server-side and set `data-theme` on `<html>` before the page reaches the client. This prevents a flash of the wrong theme.

```jsx
// Next.js layout example
export default function RootLayout({ children, theme }) {
  return (
    <html data-theme={theme ?? "dark"}>
      <body>{children}</body>
    </html>
  );
}
```

Read the user's preference from a cookie or `localStorage` during SSR.

---

## Do / Don't

| Do | Don't |
|---|---|
| Set `data-theme` on `<html>` (or any ancestor) | Set theme classes, CSS variables, or inline styles to switch themes |
| Use semantic color tokens — they resolve automatically | Write `[data-theme="light"] .myComponent` overrides in component CSS |
| Remove the `data-theme` attribute to return to dark default | Set `data-theme="dark"` explicitly (works, but unnecessary) |
| Resolve theme preference server-side to prevent flash | Apply theme via JS after paint — causes flash of wrong theme |
| Only color tokens differ between themes; use all other tokens freely | Duplicate non-color tokens for light/dark variants |

```jsx
/* Do: set data-theme on html element */
document.documentElement.dataset.theme = "light";

/* Don't: change CSS variables directly */
document.documentElement.style.setProperty("--canopy-ds-color-surface-surface-base", "#fff");
```

```css
/* Do: use semantic tokens — they resolve per-theme automatically */
.card {
  background: var(--canopy-ds-color-surface-surface-level-1);
  color: var(--canopy-ds-color-text-icon-text-default);
}

/* Don't: write theme-specific overrides in component CSS */
.card { background: #1a1a1a; }
[data-theme="light"] .card { background: #ffffff; }
```

```jsx
/* Do: SSR — set theme before first paint */
<html data-theme={userTheme ?? "dark"}>

/* Don't: apply theme in useEffect — causes FOUC */
useEffect(() => {
  document.documentElement.dataset.theme = userTheme;
}, []);
```
