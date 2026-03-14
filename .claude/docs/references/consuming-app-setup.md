# Consuming App Setup — Canopy Design System

Use this checklist when integrating `@canopy-ds/react` and `@canopy-ds/tokens` into an app. Import order and one global stylesheet determine that reset and tokens apply correctly; focus is handled by design system components.

---

## 1. Import order (app entry)

In your app entry (e.g. `src/main.jsx`, `src/index.jsx`, or root layout), import in this order:

1. **Reset** (DS or your own) — runs first so browser defaults are cleared.
2. **Design system tokens and styles** — variables, typography, then component styles.

```js
// 1. Reset first (use DS reset or your own — see below)
import "@canopy-ds/tokens/reset.css";

// 2. Design system tokens and styles
import "@canopy-ds/react/styles";
```

If you use your own global stylesheet that includes the reset, put it first:

```js
import "./index.css";   // your app global (reset + any app-level rules)
import "@canopy-ds/react/styles";
```

Never import design system styles before your reset (or the DS reset). Otherwise layout and list resets won't take effect as intended.

---

## 2. Reset: use the DS reset or your own

**Option A — Use the design system reset (recommended)**

Import the shipped reset so you get updates when you upgrade the package:

```js
import "@canopy-ds/tokens/reset.css";
import "@canopy-ds/react/styles";
```

`reset.css` contains: universal margin/padding/box-sizing reset and `ul[class], ol[class] { list-style: none; }`. See [reset-and-defaults.md](./reset-and-defaults.md) for rationale.

**Option B — Use your own global stylesheet**

If you prefer to own the reset (e.g. in `src/index.css`), put the same rules at the **top** of that file (before any `:root` or token overrides):

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

ul[class], ol[class] {
  list-style: none;
}
```

Then import that file before the design system:

```js
import "./index.css";
import "@canopy-ds/react/styles";
```

---

## 3. Focus: leave it to the design system

Design system components (Button, GlassButton, etc.) already use `:focus-visible` and the design token for the focus ring. Do **not** add `outline: none`, `outline: 0`, or custom `:focus` / `:focus-visible` in your app's component CSS unless you're extending a DS component and following the same pattern (3px outline + offset + `var(--canopy-ds-color-border-border-strong)`).

- **App:** No `outline` or `:focus` in `src/**/*.css`. Focus is handled by DS components.
- **Custom interactive elements:** If you build your own (e.g. a custom card that's focusable), add a visible `:focus-visible` style using the same token. See [reset-and-defaults.md](./reset-and-defaults.md) and [accessibility.md](./accessibility.md).

---

## 4. Checklist

| Step | Action |
|------|--------|
| 1 | Install `@canopy-ds/react` and `@canopy-ds/tokens`. |
| 2 | In app entry: import reset first, then `@canopy-ds/react/styles` (or token CSS). |
| 3 | Either use `@canopy-ds/tokens/reset.css` or put the same reset + list rules in your own global CSS (top of file). |
| 4 | Do not set `outline: none` or custom focus in app CSS; DS components own focus. |
| 5 | (Optional) Copy `CLAUDE.md` and `.claude/` from the design system repo into your consuming app so Claude Code has the rules. |

---

## Do / Don't

| Do | Don't |
|----|--------|
| Import reset (DS or your own) before design system styles | Import `@canopy-ds/react/styles` before your reset |
| Use `@canopy-ds/tokens/reset.css` to get reset updates on package upgrade | Copy-paste the reset once and never update it (unless you own the snippet) |
| Leave focus styling to DS components in app CSS | Add `outline: none` or custom `:focus` in app component stylesheets |
| Put reset rules at the top of your global CSS if you own it | Put reset after `:root` or token overrides |

```js
// Do: reset first, then DS
import "@canopy-ds/tokens/reset.css";
import "@canopy-ds/react/styles";

// Don't: DS first, then reset — reset should run before tokens
import "@canopy-ds/react/styles";
import "@canopy-ds/tokens/reset.css";
```
