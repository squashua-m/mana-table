---
description: Scaffold a new React component in the Canopy Design System. Use when the user asks to "add a component", "create a <ComponentName>", or "build a new UI component".
---

# Create a New Component

Follow these steps in order. Do not skip any step.

---

## Step 1 — Create the component file

`packages/react/src/ComponentName/ComponentName.jsx`

```jsx
import { forwardRef } from "react";
import styles from "./ComponentName.module.css";

/**
 * ComponentName – one-line description.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const ComponentName = forwardRef(function ComponentName(
  { className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
});
```

Rules:
- `forwardRef` with named inner function (not anonymous arrow)
- JSDoc block documenting every non-obvious prop
- `className` + `...rest` passthrough on root element
- No inline styles — all values via `var(--canopy-ds-*)`

---

## Step 2 — Create the CSS Module

`packages/react/src/ComponentName/ComponentName.module.css`

```css
.root {
  /* Base styles using design tokens only */
  padding: var(--canopy-ds-spacing-md);
  border-radius: var(--canopy-ds-radius-lg);
  background: var(--canopy-ds-color-surface-surface-level-1);
}

/* Variants */
.variantPrimary { … }

/* Sizes */
.sizeSm { … }
.sizeLg { … }

/* States (visual only — logic lives in .jsx) */
.root:hover { … }
.root:focus-visible { … }
.root:disabled { … }
```

Rules:
- `var(--canopy-ds-*)` for all visual values — no hex, no raw px
- camelCase class names
- No `!important`
- Dark theme is default; only add `[data-theme="light"]` overrides if a token doesn't handle it automatically

---

## Step 3 — Create the barrel export

`packages/react/src/ComponentName/index.js`

```js
export { ComponentName } from "./ComponentName.jsx";
```

---

## Step 4 — Add to the package barrel

`packages/react/src/index.js` — add in alphabetical order:

```js
export { ComponentName } from "./ComponentName/index.js";
```

---

## Step 5 — Create Storybook stories

`packages/react/src/ComponentName/ComponentName.stories.jsx`

```jsx
import { ComponentName } from "./ComponentName.jsx";

export default {
  title: "Components/ComponentName",
  component: ComponentName,
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary"] },
    disabled: { control: "boolean" },
  },
  args: { children: "ComponentName", variant: "primary", disabled: false },
};

export const Playground = {};

export const AllVariants = {
  name: "All Variants",
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)" }}>
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
    </div>
  ),
};
```

Rules:
- `Playground` is always the first export (empty object — uses default args + controls)
- `parameters.layout: "fullscreen"` for full-width components (Header, ActionBar, PageLayout)
- `parameters.backgrounds: { default: "dark" }` for glass or dark-surface components
- Inline styles in stories allowed for layout scaffolding only; use `var(--canopy-ds-spacing-*)` for spacing

---

## Step 6 — Update component documentation

`.claude/docs/references/components.md` — add the component to the correct category with a brief description and prop table.

---

## Step 7 — Verify

```bash
npm run storybook    # from repo root — confirm stories render
npm run lint         # from repo root — no new errors
```
