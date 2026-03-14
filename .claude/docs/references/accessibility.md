# Accessibility — Canopy Design System

> Standard: WCAG 2.1 AA minimum. Aim for AAA where practical.
> Philosophy: Accessibility is built in at the component level. Consumers should not need to add accessibility fixes on top of design system components.

---

## Core Rules

1. **Semantic HTML first.** Use the element that communicates the role: `<button>` for actions, `<a>` for navigation, `<h1>`–`<h6>` for headings, `<nav>` for navigation regions, `<main>` for page content. Add `role` only when a semantic element is unavailable.

2. **Every interactive element is keyboard-accessible.** If a mouse user can click it, a keyboard user must be able to reach it with `Tab` and activate it with `Enter` / `Space`.

3. **All focus states are visible.** Use `:focus-visible` (not `:focus`) for programmatic focus styling so mouse users don't see the outline but keyboard users do.

4. **Color is never the sole signal.** Status, errors, and states must also be communicated with text, icons, or patterns — not only by color change.

5. **All images and icons need text alternatives.** Decorative images/icons: `aria-hidden="true"`. Meaningful icons: `aria-label` on the parent button, or visible label text nearby.

---

## Focus Styles

Always use `:focus-visible` for keyboard focus. The design system standard:

```css
.myElement:focus-visible {
  outline: 3px solid var(--canopy-ds-color-border-border-strong);
  outline-offset: 5px;
}
```

Never remove focus outlines without replacing them:

```css
/* WRONG */
:focus { outline: none; }
*:focus { outline: 0; }

/* CORRECT — remove only for mouse/touch, keep for keyboard */
:focus:not(:focus-visible) { outline: none; }
```

---

## Buttons

### Standard button

```jsx
<button type="button" onClick={handleClick}>
  Save changes
</button>
```

- Always set `type="button"` on non-submit buttons inside forms (prevents accidental form submission).
- `type="submit"` only on the intended form submission trigger.

### Icon-only button (requires `aria-label`)

```jsx
<GlassButton iconOnly size="md" aria-label="Close dialog">
  <Icon name="x" aria-hidden="true" />
</GlassButton>
```

- The `aria-label` describes what the button **does**, not what the icon looks like.
- Add `aria-hidden="true"` to the icon so screen readers don't announce the SVG content.

### Disabled buttons

```jsx
<button type="button" disabled>Submit</button>
```

- Native `disabled` on `<button>` is correct — it removes the element from the tab order and announces "dimmed/unavailable" to assistive technology.
- Include a visible indicator beyond just reduced opacity when possible.

---

## Links

### Standard link

```jsx
<a href="/dashboard">Go to dashboard</a>
```

- Link text must describe the destination, not the action: "View your profile" not "Click here".

### Disabled link (no `disabled` attribute on `<a>`)

`<a>` does not support `disabled`. Use `aria-disabled` + suppress navigation:

```jsx
// CORRECT
<a
  href={isDisabled ? undefined : href}
  aria-disabled={isDisabled ? true : undefined}
  onClick={(e) => { if (isDisabled) e.preventDefault(); onClick?.(e); }}
  className={[styles.link, isDisabled && styles.disabled].filter(Boolean).join(" ")}
>
  {children}
</a>

// WRONG — disabled attribute is not valid on <a>
<a href="#" disabled>Link</a>
```

### Navigation landmark

```jsx
<nav aria-label="Main">
  <a href="/">Home</a>
  <a href="/games" aria-current="page">Games</a>
</nav>
```

- Use `aria-label` on `<nav>` when there are multiple nav regions on a page to distinguish them.
- Use `aria-current="page"` on the link that matches the current URL.

---

## Forms

### Label every input

```jsx
// Preferred: visible label associated by htmlFor/id
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// For visually-hidden labels (search fields, etc.)
<label htmlFor="search" className="sr-only">Search</label>
<input id="search" type="search" placeholder="Search games…" />
```

Never use `placeholder` as a substitute for a label — placeholders disappear and have low contrast.

### Error and helper text

```jsx
<label htmlFor="username">Username</label>
<input
  id="username"
  type="text"
  aria-describedby={hasError ? "username-error" : "username-hint"}
  aria-invalid={hasError ? "true" : undefined}
/>
{hasError ? (
  <span id="username-error" role="alert">
    Username is already taken
  </span>
) : (
  <span id="username-hint">
    Must be 3–20 characters
  </span>
)}
```

- `aria-describedby` links the input to its helper/error text.
- `aria-invalid="true"` signals an error state to assistive technology.
- `role="alert"` on error messages announces them immediately when they appear.

---

## Images and Icons

### Decorative (no information, hides from screen readers)

```jsx
<img src="/bg-texture.png" alt="" aria-hidden="true" />
<Icon name="chevron-right" aria-hidden="true" />
```

### Meaningful (conveys information)

```jsx
// Icon with visible label nearby (preferred)
<button type="button">
  <Icon name="download" aria-hidden="true" />
  Download
</button>

// Icon-only (label on the button)
<button type="button" aria-label="Download file">
  <Icon name="download" aria-hidden="true" />
</button>

// Image with alt text
<img src="/avatar.png" alt="Player avatar for JohnDoe" />
```

### Avatar pattern

```jsx
// Avatar in context (decorative — user's name visible elsewhere)
<img src={avatarUrl} alt="" aria-hidden="true" />

// Avatar as standalone identity element
<img src={avatarUrl} alt={`${user.name}'s avatar`} />
```

---

## ARIA Patterns

### Expandable / toggle elements

```jsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="mobile-nav"
  onClick={() => setIsOpen(o => !o)}
>
  {isOpen ? "Close menu" : "Open menu"}
</button>

<nav id="mobile-nav" aria-hidden={!isOpen}>
  {/* nav links */}
</nav>
```

### Modal / dialog

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-body"
>
  <h2 id="dialog-title">Confirm action</h2>
  <p id="dialog-body">This cannot be undone.</p>
  <button type="button" onClick={onConfirm}>Confirm</button>
  <button type="button" onClick={onClose}>Cancel</button>
</div>
```

- Focus must move to the dialog when it opens.
- Focus must be trapped inside the dialog while it is open.
- Focus must return to the trigger element when the dialog closes.

### Live regions (dynamic content updates)

```jsx
// Polite — announced after current speech finishes
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive — interrupts current speech (use sparingly)
<div role="alert">
  {errorMessage}
</div>
```

---

## Keyboard Interaction Patterns

| Component type        | Expected keyboard behavior                                    |
|-----------------------|---------------------------------------------------------------|
| Button                | `Tab` to focus, `Enter`/`Space` to activate                   |
| Link                  | `Tab` to focus, `Enter` to navigate                           |
| Checkbox              | `Tab` to focus, `Space` to toggle                             |
| Radio group           | `Tab` into group, arrow keys to change selection              |
| Select / dropdown     | `Tab` to focus, `Enter`/`Space` to open, arrows to navigate, `Escape` to close |
| Modal                 | Focus traps inside, `Escape` closes                           |
| Tabs                  | `Tab` to focus tab list, left/right arrows to switch tabs     |
| Menu                  | `Tab` to focus trigger, `Enter`/`Space` to open, arrows to navigate, `Escape` to close |

---

## Color Contrast

WCAG 2.1 AA minimums:

| Text size            | Minimum contrast ratio |
|----------------------|------------------------|
| Normal text (< 18px) | 4.5:1                  |
| Large text (≥ 18px bold, ≥ 24px) | 3:1         |
| UI components and graphics | 3:1               |

Token pairs that meet contrast in dark mode (against `surface-base`):

| Text token         | Background       | Use                      |
|--------------------|------------------|--------------------------|
| `text-default`     | `surface-base`   | Body text                |
| `text-strong`      | `surface-base`   | Headings, emphasis       |
| `text-on-primary`  | `action-primary` | Text on mint buttons     |

Always verify new color combinations with a contrast checker when using tokens not in this table.

---

## Reduced Motion

Always respect `prefers-reduced-motion` for all decorative transitions. Structural animations (e.g. a modal sliding in) should be replaced with an instant show/hide.

```css
/* Decorative transitions — disable */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}

/* Structural — instant instead of animated */
@media (prefers-reduced-motion: reduce) {
  .modal {
    animation: none;
    transition: none;
  }
}
```

```jsx
// JavaScript: check before animating
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

---

## Screen Reader Only Utility

For content that must be accessible but should not be visible:

```css
/* In your global CSS or a shared module */
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```jsx
<span className="sr-only">Loading…</span>
<span aria-hidden="true"><Spinner /></span>
```

---

## Anti-Patterns

```jsx
// WRONG — div as button (not keyboard accessible by default)
<div onClick={handleClick}>Save</div>

// CORRECT
<button type="button" onClick={handleClick}>Save</button>
```

```jsx
// WRONG — tab index manipulation (breaks natural order)
<div tabIndex="0" onClick={handleClick}>Save</div>

// CORRECT — use the native element
<button type="button" onClick={handleClick}>Save</button>
```

```jsx
// WRONG — icon-only with no label
<button type="button"><Icon name="x" /></button>

// CORRECT
<button type="button" aria-label="Close dialog">
  <Icon name="x" aria-hidden="true" />
</button>
```

```jsx
// WRONG — error only communicated by color
<input style={{ borderColor: "red" }} />

// CORRECT — color + text + aria
<input aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Enter a valid email address</span>
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Use semantic HTML elements (`<button>`, `<a>`, `<nav>`, `<h1>`–`<h6>`) | Add `role="button"` to a `<div>` — use a real `<button>` |
| Add `aria-label` to icon-only buttons | Leave icon-only buttons without any text alternative |
| Use `:focus-visible` for focus ring styles | Use `:focus` (shows outline on mouse click) or `outline: none` |
| Use `aria-disabled` on disabled links | Use the `disabled` attribute on `<a>` — it has no browser meaning |
| Pair every color-based status with text or an icon | Use color alone to communicate error, warning, or success |

```jsx
/* Do: semantic button with aria-label for icon-only */
<button type="button" aria-label="Close dialog">
  <Icon name="x" aria-hidden="true" />
</button>

/* Don't: div with click handler, no keyboard or screen reader support */
<div onClick={handleClose}>
  <Icon name="x" />
</div>
```

```jsx
/* Do: aria-disabled on a link, href removed */
<a
  href={isDisabled ? undefined : "/next"}
  aria-disabled={isDisabled || undefined}
  onClick={isDisabled ? (e) => e.preventDefault() : undefined}
>
  Continue
</a>

/* Don't: disabled attribute on an anchor */
<a href="/next" disabled>Continue</a>
```

```css
/* Do: :focus-visible for keyboard-only outline */
.button:focus-visible {
  outline: 3px solid var(--canopy-ds-color-border-border-strong);
  outline-offset: 5px;
}

/* Don't: removes focus for all users */
.button:focus { outline: none; }
```
