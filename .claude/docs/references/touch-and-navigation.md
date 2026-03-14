# Touch and Navigation — Avoiding Wrong or Double Actions

> When a tap triggers navigation or a state change, a delayed synthetic `click` can fire on whatever element is now under the finger, or the same button can fire twice. This doc explains what the design system does and what consumers should do for edge cases.

Related: [mobile-first.md](./mobile-first.md) (touch targets), [accessibility.md](./accessibility.md) (keyboard and focus).

---

## What the design system does

**Button** and **GlassButton** already:

1. **Coalesce clicks** — Only one `onClick` is forwarded per 400ms per button. Touch fires `pointerdown` (we run the action) and the browser may later fire a synthetic `click`; we ignore that second invocation within the window.
2. **Suppress the ignored click on `<button>`** — When we ignore a duplicate (within the 400ms window), we call `preventDefault()` and `stopPropagation()` on that click so it does not bubble to parents or trigger other handlers. Links (`<a>`) do not suppress, so the first real click can still perform navigation.

This fixes **one tap → same button fires twice**. It does **not** fix:

- One tap hitting a **different** button (wrong target or layering).
- A button on a **new screen** reacting to a **stale** synthetic click that was meant for the previous screen.

---

## Stale click after navigation

**What happens:** User taps Button A → your app runs the action and navigates to Screen B. The browser may still fire a synthetic `click` ~300ms later at the same coordinates. By then, Screen B is visible, so that click is delivered to whatever element is now under that point (e.g. a button on Screen B). So a button on the **new** screen runs as if the user had tapped it.

**Why the DS can’t fix it alone:** Once you’ve navigated, Button A may be unmounted. The stale click is dispatched to the new DOM; the design system has no way to “take back” an event that the browser delivers to a different component.

**What consumers can do:**

1. **Rely on `preventDefault()` on touch** — We call `preventDefault()` on `pointerdown` for touch on buttons. In many browsers that prevents the subsequent synthetic click. If your target browsers still show the issue, add a guard on the new screen.
2. **Stale-click guard on the new screen** — Ignore the first click (or first pointer/click) that occurs within a short window (e.g. 400ms) after the new screen mounts. That way a delayed synthetic click from the previous tap is discarded.

   Example pattern: mount a new route/screen and set a ref or state `mountedAt = Date.now()`. In the root or key handlers of that screen, if `Date.now() - mountedAt < 400` and the event is a click (or the first interaction), call `preventDefault()` / `stopPropagation()` and do not run the action. After 400ms, treat clicks as normal.

3. **Delay navigation slightly** — In rare cases, delaying the navigation by ~50–100ms after the tap can allow the synthetic click to fire on the old screen first, where our coalescing will ignore it. This can feel slightly laggy and is usually less preferable than a stale-click guard.

---

## Wrong target / layering

**What happens:** A tap is received by a button that isn’t the one the user meant — e.g. an overlay is visible but a button “underneath” is still on top in the stacking order, or two buttons overlap.

**This is a layout / stacking issue.** The design system does not control your tree or z-index.

**What consumers should do:**

1. **Stacking order** — Ensure the visible, interactive layer is actually on top. Use `z-index` (and stacking contexts) so the current screen or modal is above previous content.
2. **Hide or unmount inactive content** — When showing a new screen or overlay, hide or unmount the previous screen so it cannot receive events. Alternatively, set `pointer-events: none` on the inactive layer so touches pass through to the correct layer (or to nothing).
3. **Avoid overlapping hit areas** — Keep touch targets for distinct actions from overlapping. Use spacing (e.g. `var(--canopy-ds-spacing-xs)` between targets) so one tap maps to one control.

---

## Summary

| Issue | DS behavior | Consumer action |
|-------|-------------|-----------------|
| Same button fires twice (touch + synthetic click) | Coalescing + suppress ignored click on `<button>` | None. |
| Stale click hits new screen after navigation | Cannot intercept once event goes to new DOM | Stale-click guard on new screen (ignore first click within ~400ms of mount), or rely on preventDefault on touch. |
| Tap hits wrong button (layering / overlap) | N/A | Correct stacking (z-index), hide/unmount or `pointer-events: none` on inactive UI, avoid overlapping targets. |
