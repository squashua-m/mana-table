# Component Authoring Checklist — Canopy Design System

Use this when creating any new component in `packages/react/src/`. Every item is a hard requirement unless explicitly noted as optional.

---

## File structure

- [ ] Component lives in its own folder: `src/ComponentName/`
- [ ] Files: `ComponentName.jsx`, `ComponentName.module.css`, `index.js`, `ComponentName.stories.jsx`
- [ ] `index.js` re-exports the component: `export { ComponentName } from "./ComponentName.jsx";`
- [ ] Component is added to `packages/react/src/index.js`

## Component authoring

- [ ] Uses `forwardRef` with a named inner function:
  ```jsx
  export const MyComponent = forwardRef(function MyComponent(props, ref) { … });
  ```
- [ ] Spreads `...rest` onto the root element (allows `data-*`, `aria-*`, event handlers from consumers)
- [ ] Default prop values are destructured inline (not a separate `defaultProps` object)
- [ ] Validates enum props with a constants array and falls back to the default value:
  ```jsx
  const SIZES = ["sm", "md", "lg"];
  const resolvedSize = SIZES.includes(size) ? size : "lg";
  ```

## Styling

- [ ] All styles in `ComponentName.module.css` — no inline styles
- [ ] All color values from `var(--canopy-ds-color-*)` — no hex, rgb, or named colors
- [ ] All spacing from `var(--canopy-ds-spacing-*)` — no raw px values
- [ ] All radius from `var(--canopy-ds-radius-*)` — no raw `border-radius` literals
- [ ] All motion from `var(--canopy-ds-motion-*)` — no raw durations or easing literals
- [ ] Typography uses `.type-*` classes — no inline `font-size`, `font-weight`, etc.
- [ ] Blur uses `var(--canopy-ds-blur-*)` — no raw `blur(Npx)` literals
- [ ] Glass surfaces use `surface-glass` + `blur-md` + `border-glass` (the canonical three)
- [ ] Elevation uses `var(--canopy-ds-elevation-*)` — no hardcoded box-shadow values

## Accessibility

- [ ] Interactive elements are focusable and have visible `:focus-visible` styles
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled `<a>` elements use `aria-disabled` + suppress `href` (do not use `disabled` on `<a>`)
- [ ] Color is never the sole means of conveying information (add text or icons for status)
- [ ] `role` is only added if the semantic element doesn't already convey the role
- [ ] `<button type="button">` on all non-submit buttons (prevents accidental form submission)

## Touch

- [ ] `<button>` elements that fire `onClick` use the pointer-down pattern for iOS:
  ```jsx
  const handlePointerDown = (e) => {
    if (e.pointerType === "touch" && onClick) {
      e.preventDefault();
      onClick(e);
    }
    onPointerDown?.(e);
  };
  ```

## Theming

- [ ] Component works correctly in both dark and light themes without any theme-specific code
- [ ] No `[data-theme]` selectors in the component's CSS module — themes are handled by the token layer
- [ ] No hardcoded theme-specific values anywhere

## Stories

- [ ] `ComponentName.stories.jsx` exports a `default` with `title` and `component`
- [ ] Has a `Default` story showing the primary use case
- [ ] Has stories for all meaningful variants / states (sizes, variants, disabled, etc.)
- [ ] Story controls use `argTypes` for enum props to show dropdowns in Storybook

## Anti-patterns to avoid

```jsx
// WRONG — hardcoded color
style={{ color: "#7fffd4" }}

// WRONG — inline style for spacing
style={{ padding: "16px" }}

// WRONG — defaultProps (deprecated)
MyComponent.defaultProps = { size: "md" };

// WRONG — no forwardRef
export function MyComponent(props) { … }

// WRONG — theme-specific CSS
[data-theme="light"] .button { background: white; }
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Follow the checklist in order for every new component | Skip sections because the component "seems simple" |
| Use `forwardRef` with a named inner function | Export anonymous arrow function components |
| Add `...rest` spread and `className` passthrough on the root element | Hardcode a closed API that prevents consumers from adding data attributes or event handlers |
| Validate enum prop values against a constants array | Trust that consumers will pass valid values |
| Add `aria-label` to all icon-only interactive elements | Ship an icon-only button without a screen reader label |

```jsx
/* Do: full checklist applied */
/**
 * Badge – decorative status label.
 * @param {object} props
 * @param {"success"|"caution"|"critical"} [props.variant="success"]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export const Badge = forwardRef(function Badge(
  { variant = "success", className, children, ...rest },
  ref
) {
  const resolvedVariant = VARIANTS.includes(variant) ? variant : "success";
  return (
    <span
      ref={ref}
      className={[styles.badge, styles[`variant${resolvedVariant.charAt(0).toUpperCase()}${resolvedVariant.slice(1)}`], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
});

/* Don't: no forwardRef, no rest spread, no variant validation, no JSDoc */
export default ({ variant, children }) => (
  <span className={`badge badge--${variant}`}>{children}</span>
);
```
