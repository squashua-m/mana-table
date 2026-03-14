# Motion Tokens — Canopy Design System

> Source of truth: `tokens/semantic-tokens.json` → Motion collection.
> Duration CSS pattern: `--canopy-ds-motion-<name>` (value in `ms`)
> Easing CSS pattern: `--canopy-ds-motion-ease-<name>` (cubic-bezier string)

## How Motion Tokens Work

Motion tokens are mode-agnostic (no dark/light split). Duration values are emitted as `ms` strings (e.g. `150ms`). Easing values are cubic-bezier function strings. The intermediate `duration/` and `easing/` path segments are flattened, so CSS variables are `--canopy-ds-motion-fast`, not `--canopy-ds-motion-duration-fast`.

---

## Duration Tokens

| Token               | CSS Variable                    | Value | Use for                                            |
|---------------------|---------------------------------|-------|----------------------------------------------------|
| `motion-instant`    | `--canopy-ds-motion-instant`     | 0ms   | State changes that must feel immediate; no flash   |
| `motion-fast`       | `--canopy-ds-motion-fast`        | 150ms | Hover effects, small state fills, icon swaps       |
| `motion-normal`     | `--canopy-ds-motion-normal`      | 200ms | Standard component transitions (default choice)    |
| `motion-moderate`   | `--canopy-ds-motion-moderate`    | 250ms | Dropdowns, tooltips, slightly heavier elements     |
| `motion-slow`       | `--canopy-ds-motion-slow`        | 300ms | Modal open/close, sidebar expand, page transitions |
| `motion-slower`     | `--canopy-ds-motion-slower`      | 400ms | Complex animations, large surface reveals          |

### When to use each

- **instant** — Toggle visibility where any delay creates a broken feel (e.g. `display: none` swap without animation).
- **fast** — Interactive feedback: button hover fills, icon color changes, checkbox toggles. The user initiated the action; respond immediately.
- **normal** — The default. Use when unsure. Good for most card hover effects, color transitions on interactive elements.
- **moderate** — Elements with a bit of physical weight: dropdown panels that drop down, tooltip appears with content.
- **slow** — Panels that slide in/out, modals, drawers. Has presence but doesn't feel sluggish.
- **slower** — Reserved for orchestrated animations: onboarding reveals, celebration states, large background transitions.

---

## Easing Tokens

| Token                     | CSS Variable                          | Value                             | Character                                |
|---------------------------|---------------------------------------|-----------------------------------|------------------------------------------|
| `ease-linear`             | `--canopy-ds-motion-ease-linear`       | `linear`                          | Mechanical, uniform — use for spinners   |
| `ease-in`                 | `--canopy-ds-motion-ease-in`           | `cubic-bezier(0.42, 0, 1, 1)`     | Slow start → fast end — exiting elements |
| `ease-out`                | `--canopy-ds-motion-ease-out`          | `cubic-bezier(0, 0, 0.58, 1)`     | Fast start → slow end — entering elements (default) |
| `ease-in-out`             | `--canopy-ds-motion-ease-in-out`       | `cubic-bezier(0.65, 0, 0.35, 1)`  | Smooth deceleration both ends — moving elements |
| `ease-out-back`           | `--canopy-ds-motion-ease-out-back`     | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoots and settles — playful, energetic enters |
| `ease-in-back`            | `--canopy-ds-motion-ease-in-back`      | `cubic-bezier(0.36, 0, 0.66, -0.56)` | Pulls back before exiting — dismissal, removal |
| `ease-in-out-back`        | `--canopy-ds-motion-ease-in-out-back`  | `cubic-bezier(0.68, -0.55, 0.32, 1.55)` | Elastic both ends — expressive, bouncy |

### Choosing an easing

- **Entering elements** → `ease-out` (fast arrival, soft landing) or `ease-out-back` (energetic, playful).
- **Exiting elements** → `ease-in` (smooth departure) or `ease-in-back` (pulls back before leaving).
- **Moving from A to B** → `ease-in-out` (symmetric, natural).
- **Confirmation / success states** → `ease-out-back` (slight overshoot reads as satisfying).
- **Continuous rotation / progress** → `ease-linear` (mechanical, predictable).
- **Expressive / gamified** → `ease-in-out-back` (elastic, high energy — use sparingly).

---

## Usage Patterns

### Standard interactive transition

```css
transition:
  background-color var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out),
  color var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out);
```

### Enter/exit (e.g. dropdown panel)

```css
/* Entering */
transition: opacity var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out),
            transform var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out);

/* Exiting (reverse: ease-in) */
transition: opacity var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-in),
            transform var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-in);
```

### Scale on press (button active state)

```css
transition: transform var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-out);

&:active:not(:disabled) {
  transform: scale(0.92);
}
```

### Playful enter (badge pop)

```css
transition: transform var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out-back);

/* from */
transform: scale(0.8);
/* to */
transform: scale(1);
```

### Loading spinner

```css
animation: spin var(--canopy-ds-motion-slower) var(--canopy-ds-motion-ease-linear) infinite;
```

---

## Rules

- Always use token variables for duration and easing. No `0.15s`, no `ease`, no `cubic-bezier(...)` literals.
- Prefer `ease-out` for most entering transitions — it is the most natural and widely applicable.
- Pair enter and exit transitions: if you animate something in with `ease-out`, animate it out with `ease-in`.
- Respect `prefers-reduced-motion`: wrap decorative transitions in a media query.

```css
@media (prefers-reduced-motion: reduce) {
  .myElement {
    transition: none;
  }
}
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `--canopy-ds-motion-*` tokens for all durations and easings | Write raw values like `0.15s`, `ease`, or `cubic-bezier(...)` literals |
| Pair enter (`ease-out`) and exit (`ease-in`) transitions | Use the same easing for both enter and exit |
| Wrap decorative transitions in `prefers-reduced-motion` | Animate unconditionally without respecting user motion preferences |
| Use `motion-fast` (150ms) for hover fills and small state changes | Use `motion-slower` (400ms) for simple hover color changes |
| Use `motion-instant` (0ms) when a visual delay would feel broken | Leave a transition duration on elements that need to feel immediate |

```css
/* Do: token variables, paired easing */
.panel {
  transition:
    opacity var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out),
    transform var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out);
}
.panel.exiting {
  transition:
    opacity var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-in),
    transform var(--canopy-ds-motion-fast) var(--canopy-ds-motion-ease-in);
}

/* Don't: hardcoded values, no exit pairing */
.panel {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
```

```css
/* Do: reduced-motion guard */
.badge {
  transition: transform var(--canopy-ds-motion-moderate) var(--canopy-ds-motion-ease-out-back);
}
@media (prefers-reduced-motion: reduce) {
  .badge { transition: none; }
}

/* Don't: no reduced-motion guard */
.badge {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```
