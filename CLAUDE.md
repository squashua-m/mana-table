# Mana Table — AI Context

## Project Overview

Multiplayer MTG infinite canvas built with Vite + React 19 + TypeScript. **Not Next.js** — tldraw requires a client-only setup.

```
mana-table/
├── src/
│   ├── shapes/          ← Custom tldraw shapes (MtgCardShape, MtgCardUtil)
│   ├── components/      ← Canvas UI (MtgCanvas, SpawnButton, LiveCursors, CursorPresence)
│   ├── hooks/           ← Logic hooks (useSpawnCard)
│   ├── App.tsx          ← Liveblocks RoomProvider root
│   ├── liveblocks.config.ts  ← Typed createRoomContext (Presence + Storage types)
│   ├── main.tsx         ← Entry — CSS import order is load-bearing (see below)
│   └── vite-env.d.ts   ← Vite env types + @canopy-ds/react module declarations
├── vite.config.ts       ← React alias required for canopy-ds symlinks
└── .env.local           ← VITE_LIVEBLOCKS_PUBLIC_KEY
```

**Tech stack:** Vite 6, React 19, TypeScript 5, tldraw v3, Liveblocks v3, @canopy-ds (symlinked via `file:`).

---

## Design System (@canopy-ds)

The Canopy Design System is consumed via `file:` symlinks — NOT from npm. Do not add it to npm.

### Critical CSS Import Order (`src/main.tsx`)

```ts
import "@canopy-ds/tokens/reset.css";   // 1. Reset first
import "@canopy-ds/react/styles";        // 2. DS tokens + component styles
import "tldraw/tldraw.css";              // 3. tldraw (must not be reset-overridden)
import "./index.css";                    // 4. App overrides last
```

**Never reorder these.** tldraw's CSS must come after the DS reset or the canvas layout breaks.

### Token Usage Rules

All colors, spacing, blur, shadow, motion, radius, and typography must come from `var(--canopy-ds-*)` CSS custom properties — no hardcoded hex, raw `px`, or magic numbers.

**Color** — `var(--canopy-ds-color-<category>-<token>)`

| Category | Use |
|---|---|
| `action-*` | Button/interactive fills |
| `border-*` | Borders, dividers, focus rings |
| `surface-*` | Card, panel, page backgrounds |
| `text-icon-*` | All text and icon colors |
| `decoration-*` | Badges, non-interactive accents |
| `interactive-*` | Hover/press fills |

**Spacing** — `var(--canopy-ds-spacing-<t>)`: `3xs`(2px) `2xs`(4) `xs`(8) `sm`(12) `md`(16) `lg`(24) `xl`(32) `2xl`(40) `3xl`(64)

**Radius** — `var(--canopy-ds-radius-<t>)`: `none` `2xs`(2px) `xs`(4) `sm`(8) `md`(12) `lg`(16) `xl`(24) `2xl`(32) `round`(9999)

**Blur** — `var(--canopy-ds-blur-sm)`(4px) / `var(--canopy-ds-blur-md)`(12px) / `var(--canopy-ds-blur-lg)`(24px). Always pair with a semi-transparent surface.

**Motion** — `var(--canopy-ds-motion-<name>)`: `instant`(0ms) `fast`(150ms) `normal`(200ms) `moderate`(250ms) `slow`(300ms) `slower`(400ms). Easing: `var(--canopy-ds-motion-ease-<name>)`.

**Theming** — Dark is default (`:root`). Light via `data-theme="light"` on a parent. Never hardcode theme-specific colors.

### Available Components

Import from `@canopy-ds/react`. TypeScript types live in `src/vite-env.d.ts`.

| Component | Use |
|---|---|
| `GlassButton` | Frosted-glass circular button. Props: `size` ("sm"\|"md"\|"lg"), `iconOnly`, `disabled`, `onClick`. |
| `Button` | Standard button |
| `Text` | Typography. Props: `variant` ("body-01", "caption", "display-01", etc.), `as` |
| `Heading` | Semantic h1–h6. Props: `level` (1–6), `variant` |
| `Icon` | Icon from sprite. Props: `name` (see iconography ref), `size` |
| `IconSprite` | Mount once in the tree before any `<Icon>` renders |
| `Pill` / `PillGroup` | Label chips |
| `Avatar` / `AvatarStack` | User avatars |
| `Container` / `Grid` | Layout helpers |
| `Overlay` | Modal/overlay layer |
| `Menu` / `MenuItem` / `MenuDropdown` | Dropdown menus |
| `Tabs` / `Tab` | Tab navigation |

Full API: [`.claude/docs/references/components.md`](.claude/docs/references/components.md)

---

## tldraw v3 Patterns

### Custom Shape Pattern

```ts
// 1. Define type
type MyShape = TLBaseShape<"my-shape", { w: number; h: number }>;
const myShapeProps: RecordProps<MyShape> = { w: T.number, h: T.number };

// 2. Implement ShapeUtil
class MyShapeUtil extends ShapeUtil<MyShape> {
  static override type = "my-shape" as const;
  static override props = myShapeProps;
  override getDefaultProps() { return { w: 100, h: 100 }; }
  override getGeometry(shape) { return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true }); }
  override component(shape) { return <HTMLContainer>...</HTMLContainer>; }
  override indicator(shape) { return <rect width={shape.props.w} height={shape.props.h} />; }
  // Return partial to update — do NOT call this.editor.updateShape() inside handlers
  override onDoubleClick(shape): TLShapePartial<MyShape> | void { return { id: shape.id, type: "my-shape", props: { ... } }; }
}

// 3. Register
<Tldraw shapeUtils={[MyShapeUtil]} />
```

**Key rules:**
- `rotation`, `x`, `y` are top-level shape fields — not in `props`. 90° rotation = tapped card.
- Event handlers (`onDoubleClick`, etc.) return `TLShapePartial | void` — they do NOT call `updateShape` internally.
- Use `HTMLContainer` (not a raw `div`) for React-rendered shape content.
- `TLUiOverrides` only supports `actions`, `tools`, `translations` — there is no `contextMenu` override.

---

## Liveblocks v3 Patterns

At MVP, only **Presence** is synced (cursors). tldraw canvas state is local-only.

```ts
// liveblocks.config.ts
const { RoomProvider, useMyPresence, useOthers, useUpdateMyPresence } =
  createRoomContext<Presence, Storage>(client);
```

- Store cursor as **viewport/screen coords** (`clientX`/`clientY`), not page coords. Renders stably regardless of zoom level.
- `useUpdateMyPresence` in `CursorPresence` component (listens to `pointermove` on `editor.getContainer()`).
- `useOthers` in `LiveCursors` to render remote cursors.

---

## z-index Stack

| Layer | z-index | Notes |
|---|---|---|
| tldraw toolbar | ~300 | Built-in |
| SpawnButton | 500 | Above toolbar |
| LiveCursors | 600 | Above SpawnButton |
| tldraw debug overlay | 2147483647 | Don't try to beat this |

---

## Reference Docs

Full specs in `.claude/docs/references/`:

| Topic | File |
|---|---|
| Color tokens | [references/colors.md](.claude/docs/references/colors.md) |
| Spacing & radius | [references/spacing.md](.claude/docs/references/spacing.md) |
| Typography | [references/typography.md](.claude/docs/references/typography.md) |
| Effects (blur, elevation, glass) | [references/effects.md](.claude/docs/references/effects.md) |
| Motion | [references/motion.md](.claude/docs/references/motion.md) |
| Components API | [references/components.md](.claude/docs/references/components.md) |
| Layout & grid | [references/layout.md](.claude/docs/references/layout.md) |
| Theming | [references/theming.md](.claude/docs/references/theming.md) |
| Accessibility | [references/accessibility.md](.claude/docs/references/accessibility.md) |
| Iconography | [references/iconography.md](.claude/docs/references/iconography.md) |
| Consuming app setup | [references/consuming-app-setup.md](.claude/docs/references/consuming-app-setup.md) |
| Symlink local dev | [references/symlink-local-dev.md](.claude/docs/references/symlink-local-dev.md) |
