# Iconography — Canopy Design System

> Components: `Icon`, `IconSprite`, `ControllerButtonIcon` in `@canopy-ds/react`.
> Icon source: SVG files in `/icons/` (repo root) → built into `packages/react/src/icons/generated/icon-sprite.generated.js`.
> Controller icons: inline SVGs in `packages/react/src/icons/controller-button-icons/`.

---

## Two Icon Systems

| System | Component | Delivery | Use for |
|---|---|---|---|
| General icons | `<Icon>` | SVG sprite (`<use>`) | All standard UI icons |
| Controller button icons | `<ControllerButtonIcon>` | Inline SVG (raw import) | PlayStation controller button prompts |

---

## Icon (General UI Icons)

### Setup — mount IconSprite once at app root

`<Icon>` references symbols from a hidden SVG spritesheet. Mount `<IconSprite>` once near the root of your app. Without it, all icons render blank.

```jsx
// _app.jsx or layout.jsx — once per app
import { IconSprite } from "@canopy-ds/react";

export default function App({ children }) {
  return (
    <>
      <IconSprite />
      {children}
    </>
  );
}
```

Storybook: `<IconSprite />` should be in `.storybook/preview.jsx` decorators.

### Usage

```jsx
import { Icon } from "@canopy-ds/react";

// Basic — inherits color from parent
<Icon name="arrow-right" />

// With size and thickness
<Icon name="star" size="lg" thickness="sm" />

// Decorative (default — aria-hidden applied automatically)
<Icon name="chevron-right" aria-hidden="true" />

// Meaningful (screen reader announces the label)
<Icon name="alert-circle" label="Warning" />
```

### Props

| Prop        | Type                       | Default    | Description |
|-------------|----------------------------|------------|-------------|
| `name`      | `string`                   | required   | Icon name from the sprite (see full list below) |
| `size`      | `"sm"\|"md"\|"lg"\|"xl"`   | `"md"`     | Rendered dimensions: sm=16px, md=24px, lg=32px, xl=48px |
| `thickness` | `"sm"\|"md"\|"lg"\|"xl"`   | `"md"`     | Stroke width in screen pixels: sm=1, md=2, lg=3, xl=4 |
| `color`     | `string`                   | `currentColor` | CSS color value. Defaults to inheriting from parent. |
| `label`     | `string`                   | —          | Accessible label. When omitted, icon is decorative (`aria-hidden`). |
| `className` | `string`                   | —          | Additional classes. |

### Size × Thickness guide

Stroke width does **not** scale with size — it is always exact screen pixels (enforced by `vector-effect="non-scaling-stroke"` applied during the sprite build). This means `size="lg" thickness="sm"` renders a large icon with a thin 1px stroke.

| Pairing | Visual character |
|---|---|
| `size="sm" thickness="sm"` | Small, delicate — metadata, captions |
| `size="md" thickness="md"` | Default — most UI usage |
| `size="md" thickness="lg"` | Bold, high-contrast |
| `size="lg" thickness="sm"` | Large, lightweight — decorative accents |
| `size="lg" thickness="md"` | Large, standard — feature icons, empty states |

### Color

Icons inherit `currentColor` by default. Control color by setting `color` on the parent:

```jsx
// CORRECT — token-based, theme-aware
<span style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}>
  <Icon name="check" />
</span>

// CORRECT — direct color prop (still use a token)
<Icon name="alert-circle" color="var(--canopy-ds-color-text-icon-text-caution)" />

// WRONG — hardcoded color
<Icon name="check" color="#7fffd4" />
```

### Accessibility

- **Decorative icons** (most usage): omit `label`. The component applies `aria-hidden="true"` automatically.
- **Standalone meaningful icons**: provide `label`. The component sets `role="img"` and `aria-label` automatically.
- **Icons inside labeled buttons**: keep icon decorative. The button's text or `aria-label` provides the accessible name.

```jsx
// In a labeled button — icon is decorative
<button type="button" aria-label="Delete file">
  <Icon name="trash" />
</button>

// Standalone status indicator — icon needs a label
<Icon name="check-circle" label="Completed" />
```

---

## ControllerButtonIcon

PlayStation controller button prompts. Used in the `ActionBar` component for left-side action hints.

```jsx
import { ControllerButtonIcon } from "@canopy-ds/react";

<ControllerButtonIcon name="action-left" />
<ControllerButtonIcon name="l1" size="var(--canopy-ds-spacing-xl)" />
```

### Props

| Prop         | Type      | Default                    | Description |
|--------------|-----------|----------------------------|-------------|
| `name`       | `string`  | required                   | Controller icon name (see list below) |
| `size`       | `string`  | `var(--canopy-ds-spacing-2xl)` | CSS width/height (use a token) |
| `color`      | `string`  | `currentColor`             | CSS color |
| `ariaHidden` | `boolean` | `true`                     | Hidden from screen readers by default |

### Available controller icon names

`action-down`, `action-left`, `action-right`, `action-up`, `down`, `home`, `l1`, `l2`, `left`, `left-stick`, `r1`, `r2`, `right`, `right-stick`, `select`, `start`, `up`

---

## Icon Name Reference (General Icons)

273 icons from Feather Icons. All names are kebab-case.

### Navigation & Arrows
`arrow-down`, `arrow-down-circle`, `arrow-down-left`, `arrow-down-right`, `arrow-left`, `arrow-left-circle`, `arrow-right`, `arrow-right-circle`, `arrow-up`, `arrow-up-circle`, `arrow-up-left`, `arrow-up-right`, `chevron-down`, `chevron-left`, `chevron-right`, `chevron-up`, `chevrons-down`, `chevrons-left`, `chevrons-right`, `chevrons-up`, `corner-down-left`, `corner-down-right`, `corner-left-down`, `corner-left-up`, `corner-right-down`, `corner-right-up`, `corner-up-left`, `corner-up-right`, `external-link`, `log-in`, `log-out`, `navigation`, `navigation-2`

### UI Controls
`check`, `check-circle`, `check-square`, `circle`, `minus`, `minus-circle`, `minus-square`, `more-horizontal`, `more-vertical`, `plus`, `plus-circle`, `plus-square`, `slash`, `square`, `toggle-left`, `toggle-right`, `x`, `x-circle`, `x-octagon`, `x-square`

### Alerts & Status
`alert-circle`, `alert-octagon`, `alert-triangle`, `bell`, `bell-off`, `flag`, `help-circle`, `info`, `loader`, `shield`, `shield-off`, `stop-circle`, `zap`, `zap-off`

### User & People
`user`, `user-check`, `user-minus`, `user-plus`, `user-x`, `users`

### Files & Data
`archive`, `book`, `book-open`, `bookmark`, `clipboard`, `copy`, `database`, `delete`, `download`, `download-cloud`, `edit`, `edit-2`, `edit-3`, `file`, `file-minus`, `file-plus`, `file-text`, `folder`, `folder-minus`, `folder-plus`, `inbox`, `layers`, `list`, `package`, `paperclip`, `save`, `server`, `upload`, `upload-cloud`

### Media & Entertainment
`airplay`, `camera`, `camera-off`, `cast`, `disc`, `fast-forward`, `film`, `headphones`, `image`, `mic`, `mic-off`, `music`, `pause`, `pause-circle`, `play`, `play-circle`, `radio`, `repeat`, `rewind`, `skip-back`, `skip-forward`, `speaker`, `tv`, `video`, `video-off`, `voicemail`, `volume`, `volume-1`, `volume-2`, `volume-x`, `youtube`

### Communication
`at-sign`, `link`, `link-2`, `mail`, `message-circle`, `message-square`, `phone`, `phone-call`, `phone-forwarded`, `phone-incoming`, `phone-missed`, `phone-off`, `phone-outgoing`, `rss`, `send`, `share`, `share-2`, `wifi`, `wifi-off`

### Maps & Location
`compass`, `globe`, `map`, `map-pin`

### Tech & Development
`bluetooth`, `code`, `command`, `cpu`, `git-branch`, `git-commit`, `git-merge`, `git-pull-request`, `hard-drive`, `hash`, `key`, `lock`, `monitor`, `power`, `printer`, `rotate-ccw`, `rotate-cw`, `settings`, `sidebar`, `sliders`, `smartphone`, `tablet`, `terminal`, `tool`, `trello`, `type`, `unlock`

### Charts & Analytics
`activity`, `bar-chart`, `bar-chart-2`, `pie-chart`, `trending-down`, `trending-up`

### E-commerce & Finance
`credit-card`, `dollar-sign`, `gift`, `percent`, `pocket`, `shopping-bag`, `shopping-cart`, `truck`

### Shapes & Symbols
`anchor`, `aperture`, `award`, `box`, `briefcase`, `calendar`, `clock`, `coffee`, `columns`, `crop`, `crosshair`, `divide`, `divide-circle`, `divide-square`, `droplet`, `feather`, `filter`, `grid`, `heart`, `hexagon`, `layout`, `life-buoy`, `maximize`, `maximize-2`, `minimize`, `minimize-2`, `moon`, `move`, `octagon`, `pen-tool`, `scissors`, `search`, `star`, `sun`, `sunrise`, `sunset`, `tag`, `target`, `thermometer`, `thumbs-down`, `thumbs-up`, `triangle`, `umbrella`, `watch`, `wind`, `zoom-in`, `zoom-out`

### Emoji / Expression
`frown`, `meh`, `smile`

---

## Adding New Icons

1. Add the `.svg` file to `/icons/` at the repo root. Use a 24×24 viewBox. Use `stroke="currentColor"` (the build script sets this automatically, but it's good practice).
2. Run `npm run build:icons` from `packages/react/`.
3. The new icon name (derived from the filename without extension, kebab-case) is immediately available in `<Icon name="your-icon-name" />`.
4. Do not manually edit `packages/react/src/icons/generated/icon-sprite.generated.js` — it is always overwritten on rebuild.

See [scripts/icon-sprite.md](../scripts/icon-sprite.md) for full details on the build process and transforms applied.

---

## Do / Don't

| Do | Don't |
|---|---|
| Mount `<IconSprite />` once at app root before any `<Icon>` usage | Mount `<IconSprite />` inside every component that uses icons |
| Use `label` prop for meaningful icons; omit for decorative | Use `aria-label` directly on `<Icon>` — use `label` prop instead |
| Use `currentColor` (default) for icon color — control via `color` on parent | Set explicit color on the `<Icon>` element — use the parent's token-based `color` |
| Use `vector-effect="non-scaling-stroke"` — the build script adds it automatically | Manually edit the generated sprite file to change stroke behaviour |
| Derive icon names from filename: `arrow-left.svg` → `name="arrow-left"` | Guess icon names — check the filename or Storybook Icons story |

```jsx
/* Do: IconSprite once at root, icons use label for meaningful instances */
// layout.jsx
<IconSprite />

// component
<Icon name="check" size="md" />                            // decorative — no label needed
<Icon name="alert-circle" label="Warning" />               // meaningful — screen reader reads label
<button aria-label="Close"><Icon name="x" /></button>      // label on button, icon is decorative
```

```jsx
/* Don't: mounting IconSprite per-component, wrong label approach */
// MyComponent.jsx
<IconSprite />   // should only be at root
<Icon name="x" aria-label="Close" />   // use label prop, not aria-label directly
```

```jsx
/* Do: control icon color via parent element */
<span style={{ color: "var(--canopy-ds-color-text-icon-text-success)" }}>
  <Icon name="check-circle" size="md" />
</span>

/* Don't: hardcoded color on icon */
<Icon name="check-circle" style={{ color: "#00ff00" }} />
```
