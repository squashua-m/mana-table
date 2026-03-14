# Reset & Browser Defaults — Canopy Design System

> Goal: Move from browser-provided defaults to **author-controlled** styling without losing underlying semantics (accessibility, list structure, focus visibility).

---

## 1. The Focus Ring (The "Golden Rule")

The most common mistake: developers remove the default focus outline with `outline: none` and never replace it. Keyboard users lose all visible focus indication.

**Rule:** Never use `outline: none` (or `outline: 0`) unless you **immediately** replace it with a custom, high-contrast focus style. Use `:focus-visible` so the ring only appears for keyboard users, not on mouse click.

### Code

```css
/* Only show focus rings when using a keyboard */
:focus-visible {
  outline: 3px solid var(--canopy-ds-color-border-border-strong);
  outline-offset: 5px;
}

/* Optional: remove outline only when :focus-visible will handle it */
:focus:not(:focus-visible) {
  outline: none;
}
```

In component CSS Modules, apply the same pattern to interactive elements:

```css
.button:focus-visible {
  outline: 3px solid var(--canopy-ds-color-border-border-strong);
  outline-offset: 5px;
}
```

---

## 2. Default Margins and Padding

Browsers add margins to `body`, `h1`–`h6`, `p`, and other elements. These don't help accessibility; they just conflict with layout and design tokens.

**Action:** Zero them out globally so spacing is explicitly controlled via design system tokens (`--canopy-ds-spacing-*`) and layout components.

### Code

Apply a reset at app entry (e.g. in a global stylesheet or root layout), **before** design system token CSS:

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

`box-sizing: border-box` ensures padding and border are included in width/height — consistent with how the design system expects layout to behave.

---

## 3. List Styles

`<ul>` and `<ol>` get bullets/numbers and left padding by default. For navigation menus and custom list UIs, you often want to remove the markers.

**Catch:** Some screen readers (e.g. VoiceOver on Safari) stop announcing a list as a "list" if you set `list-style: none` without preserving list semantics.

**Fix:** If it's a real list (content or navigation), keep list semantics. Use a classed selector so only "styled" lists lose bullets; add `role="list"` when the list is not purely decorative so assistive tech still announces it as a list.

### Code

```css
ul[class],
ol[class] {
  list-style: none;
}
```

In HTML/JSX, when you've removed list style but the content is still a list:

```jsx
<ul className={styles.navList} role="list">
  <li><a href="…">Home</a></li>
  <li><a href="…">About</a></li>
</ul>
```

If the "list" is purely presentational (e.g. a row of buttons that happen to be in a `ul`), you may use `role="presentation"` or `role="none"` and ensure the items are still announced correctly — but for navigation and content lists, keep `role="list"` (or no role; the native `<ul>`/`<ol>` already has list semantics; the issue arises when CSS removes the visual list style and some AT strips list semantics).

---

## Where to Apply

| Concern | Where it lives |
|--------|-----------------|
| Focus ring | Design system components (Button, GlassButton, etc.) use `:focus-visible` + token. App CSS should not set `outline`/`:focus`. |
| Margin/padding/box-sizing reset | App entry — import `@canopy-ds/tokens/reset.css` first, or put the same rules at the top of your app global CSS. |
| List reset | Shipped in `@canopy-ds/tokens/reset.css`, or in your app global CSS. Semantic list markup + `role="list"` in JSX when needed. |

**Shipped reset:** The design system provides `@canopy-ds/tokens/reset.css` (universal reset + list reset). Import it before `@canopy-ds/react/styles` so you get updates when you upgrade the package. See [consuming-app-setup.md](./consuming-app-setup.md) for import order and options.

---

## Do / Don't

| Do | Don't |
|----|--------|
| Use `:focus-visible` and a visible outline (e.g. 3px + offset) for keyboard focus | Use `outline: none` or `outline: 0` without an immediate replacement |
| Use design system token for focus ring color (`--canopy-ds-color-border-border-strong`) | Hardcode focus outline color (e.g. `outline: 2px solid blue`) |
| Apply a global reset for margin, padding, and `box-sizing` at app entry | Rely on browser defaults for body/heading/paragraph spacing |
| Use `ul[class], ol[class] { list-style: none; }` so only classed lists lose bullets | Use `ul, ol { list-style: none; }` without considering list semantics |
| Keep `role="list"` (or native `<ul>`/`<ol>`) when the content is a real list | Remove list semantics when the content is still a list for screen readers |

```css
/* Do: focus-visible with token */
.button:focus-visible {
  outline: 3px solid var(--canopy-ds-color-border-border-strong);
  outline-offset: 5px;
}

/* Don't: remove focus with no replacement */
.button:focus {
  outline: none;
}
```

```css
/* Do: reset at app root */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Don't: leave browser margins in place and fight them with component CSS */
```

```css
/* Do: classed lists only, so unstyled lists keep bullets */
ul[class], ol[class] {
  list-style: none;
}

/* Don't: strip all list styling globally without preserving semantics in markup */
ul, ol { list-style: none; }
```
