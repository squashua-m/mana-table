# Linting — Canopy Design System

> Command: `npm run lint` from repo root.
> Config: `packages/eslint-config/flat.js` (ESLint 9, flat config format).

---

## Commands

| Command | What it does |
|---|---|
| `npm run lint` | Lint `@canopy-ds/react` src + `.storybook/`, and `@canopy-ds/test-app` |
| `npm run lint:fix` | Same, with auto-fix for fixable issues |

From inside `packages/react/` directly:

```bash
npm run lint          # lint src/ and .storybook/
npm run lint:fix      # lint and auto-fix
```

---

## What the lint stack catches

### ESLint recommended

Standard JavaScript correctness rules: no unused variables (warning, ignores `_`-prefixed), no `console` in production code, no unreachable code, etc.

### React rules (`eslint-plugin-react`)

- Missing `key` prop on list items
- Invalid JSX syntax
- Incorrect hook usage (`eslint-plugin-react-hooks`): rules of hooks, exhaustive deps
- Fast Refresh compatibility (`eslint-plugin-react-refresh`): components must be the only export for HMR to work correctly

### Accessibility (`eslint-plugin-jsx-a11y`)

Static JSX accessibility analysis. Runs on every `npm run lint`. Catches:

| Rule | What it flags |
|---|---|
| `alt-text` | `<img>` missing `alt`; `<area>`, `<input type="image">` missing accessible text |
| `aria-props` | Invalid `aria-*` attribute names |
| `aria-proptypes` | Incorrect aria value types |
| `aria-role` | Invalid or non-abstract ARIA roles |
| `aria-unsupported-elements` | `aria-*` on elements that don't support it |
| `heading-has-content` | Empty `<h1>`–`<h6>` elements |
| `html-has-lang` | `<html>` missing `lang` attribute |
| `img-redundant-alt` | Alt text that says "image" or "photo" |
| `interactive-supports-focus` | Interactive elements that aren't keyboard-focusable (warning) |
| `label-has-associated-control` | `<label>` not associated with a form control |
| `no-access-key` | `accessKey` attribute (causes a11y issues) |
| `no-autofocus` | `autoFocus` attribute |
| `no-distracting-elements` | `<marquee>`, `<blink>` |
| `no-redundant-roles` | Explicit role that matches the element's implicit role |
| `role-has-required-aria-props` | ARIA role missing required properties |

### Prettier

Code formatting is enforced via `eslint-config-prettier` which disables any ESLint rules that conflict with Prettier's formatting. Run `npm run lint:fix` to auto-format.

---

## What the lint stack does NOT catch

These are known gaps — no tooling currently enforces them:

| Gap | Description |
|---|---|
| **Hardcoded color values in CSS modules** | `color: #fff`, `background: rgba(0,0,0,0.5)` in `.module.css` files are not flagged. No CSS linting is configured. |
| **Raw pixel values instead of tokens** | `padding: 16px`, `border-radius: 8px` in CSS modules are not flagged. Should use `var(--canopy-ds-spacing-*)` and `var(--canopy-ds-radius-*)`. |
| **Inline styles with hardcoded values** | `style={{ color: "#mint" }}` in JSX is not flagged. |
| **Runtime accessibility issues** | `jsx-a11y` is static analysis only. It cannot catch issues that require the DOM to exist (e.g. focus trap failures, insufficient color contrast, scroll region keyboard access). |
| **Color contrast ratios** | No automated contrast checking against WCAG thresholds. |

The CSS token enforcement gap is the most impactful. Until a CSS linter (e.g. Stylelint with a custom plugin) is added, rely on code review and the component authoring checklist.

---

## ESLint config location

The shared config lives in `packages/eslint-config/`. Individual packages reference it in their `eslint.config.js`:

```js
// packages/react/eslint.config.js
import canopyDsConfig from "@canopy-ds/eslint-config";
export default [...canopyDsConfig];
```

To add a new rule project-wide, add it to `packages/eslint-config/flat.js`.

---

## Do / Don't

| Do | Don't |
|---|---|
| Run `npm run lint` from repo root as the final step of any code change | Skip lint and rely on the editor to catch issues |
| Run `npm run lint:fix` to auto-fix formatting and simple issues | Manually re-format code that Prettier can fix automatically |
| Fix `jsx-a11y` warnings — they represent real accessibility gaps | Silence `jsx-a11y` rules with `eslint-disable` comments |
| Add new project-wide rules to `packages/eslint-config/flat.js` | Add rules to individual package `eslint.config.js` files |
| Manually audit CSS modules for hardcoded values (current gap — no CSS linter) | Assume lint passing means CSS is token-compliant |

```bash
# Do: lint as final step
npm run lint          # check
npm run lint:fix      # fix

# Don't: skip lint
git commit -m "done"  # without running lint first
```

```jsx
/* Do: fix the accessibility issue */
<button type="button" aria-label="Close">
  <Icon name="x" aria-hidden="true" />
</button>

/* Don't: silence the rule */
// eslint-disable-next-line jsx-a11y/interactive-supports-focus
<div onClick={handleClose} role="button">Close</div>
```

```css
/* Do: use tokens (manual review required — no CSS linter exists yet) */
.card {
  background: var(--canopy-ds-color-surface-surface-level-1);
  padding: var(--canopy-ds-spacing-lg);
}

/* Don't: hardcoded values — these will NOT be caught by lint */
.card {
  background: #1a1a1a;  /* lint will not catch this */
  padding: 24px;         /* lint will not catch this */
}
```
