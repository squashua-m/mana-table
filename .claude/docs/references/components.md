# Components — Canopy Design System

> Package: `@canopy-ds/react`
> All components use `forwardRef`, accept `className`, and spread `...rest` onto the root element.
> Required setup: import token CSS once at app entry — `@canopy-ds/tokens/dist/web/variables.css`, `typography.css`, `type-styles.css`.

```js
import { ComponentName } from "@canopy-ds/react";
```

---

## Inputs & Controls

### Button

Primary interactive element. Renders as `<button>` or `<a>` (when `href` is set). All variants share the same sizing tokens.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"primary"\|"secondary"\|"tertiary"\|"critical"\|"caution"` | `"primary"` | |
| `size` | `"sm"\|"md"\|"lg"\|"xl"` | `"lg"` | |
| `href` | `string` | — | Renders as `<a>` for navigation |
| `disabled` | `boolean` | `false` | |
| `type` | `"button"\|"submit"\|"reset"` | `"button"` | Ignored when `href` is set |

```jsx
<Button variant="primary" size="lg">Confirm</Button>
<Button variant="secondary" href="/cancel">Cancel</Button>
<Button variant="critical" disabled>Delete</Button>
```

---

### GlassButton

Circular frosted-glass action button. Pill shape when content is wider than the height. Renders as `<button>` or `<a>` (when `href` is set).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `size` | `"sm"\|"md"\|"lg"` | `"lg"` | 32 / 40 / 48px |
| `iconOnly` | `boolean` | `false` | Perfect circle — no inline padding |
| `href` | `string` | — | Renders as `<a>` |
| `disabled` | `boolean` | `false` | Removes blur on disabled state |
| `aria-label` | `string` | — | **Required** for icon-only usage |

```jsx
<GlassButton size="md" iconOnly aria-label="Close">
  <Icon name="x" />
</GlassButton>
<GlassButton href="/profile">Profile</GlassButton>
```

Glass surface CSS: `surface-glass` + `blur-md` + `border-glass`. See [effects.md](./effects.md) for the full recipe.

---

### Checkbox

Single checkbox input with label. Controlled via `checked` + `onChange`.

```jsx
<Checkbox
  checked={isChecked}
  onChange={(e) => setChecked(e.target.checked)}
  label="Accept terms"
/>
```

---

### RadioGroup / Radio

Radio button group. `RadioGroup` manages selection state; `Radio` is the individual option.

```jsx
<RadioGroup value={selected} onChange={setSelected} name="plan">
  <Radio value="free" label="Free" />
  <Radio value="pro" label="Pro" />
</RadioGroup>
```

---

### Switch

Toggle switch. Controlled via `checked` + `onChange`.

```jsx
<Switch
  checked={isEnabled}
  onChange={(e) => setEnabled(e.target.checked)}
  label="Enable notifications"
/>
```

---

### SegmentedButtons / Segment

Mutually exclusive option selector. Use when the user must pick exactly one from a small set of options (2–5).

```jsx
<SegmentedButtons value={view} onChange={setView}>
  <Segment value="list">List</Segment>
  <Segment value="grid">Grid</Segment>
</SegmentedButtons>
```

---

## Navigation

### Tabs / Tab

Tab navigation. `Tabs` manages the active tab; `Tab` is each individual tab item.

```jsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab value="overview">Overview</Tab>
  <Tab value="results">Results</Tab>
  <Tab value="history">History</Tab>
</Tabs>
```

---

### Menu / MenuItem / MenuDropdown

Context menu system. `Menu` is the visible list of actions. `MenuItem` is a single action row (supports `variant="critical"` for destructive actions). `MenuDropdown` wraps `Menu` with open/close state and outside-click handling.

```jsx
// Standalone menu (position yourself)
<Menu aria-label="Options">
  <MenuItem label="Edit" onClick={handleEdit} />
  <MenuItem label="Duplicate" onClick={handleDuplicate} />
  <MenuItem label="Delete" variant="critical" onClick={handleDelete} />
</Menu>

// With dropdown trigger
<MenuDropdown
  open={open}
  onOpenChange={setOpen}
  trigger={<button type="button">Options</button>}
  aria-label="Options"
>
  <MenuItem label="Edit" onClick={() => setOpen(false)} />
  <MenuItem label="Delete" variant="critical" onClick={() => setOpen(false)} />
</MenuDropdown>
```

---

## Typography

### Text

Semantic inline/block text with a design-system typography variant. Renders as `<span>` by default.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `string` | `"body-01"` | Any `.type-*` variant name |
| `as` | `string` | `"span"` | HTML element to render |

```jsx
<Text variant="body-01">Body content</Text>
<Text variant="caption-01" as="p">Small print</Text>
```

---

### Heading

Semantic heading element. `level` controls the HTML element (`h1`–`h6`); `variant` controls the visual size. These are intentionally decoupled.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `level` | `1\|2\|3\|4\|5\|6` | `1` | HTML heading level (accessibility hierarchy) |
| `variant` | `string` | — | Any `.type-*` variant name |

```jsx
<Heading level={1} variant="display-01">Page title</Heading>
<Heading level={3} variant="headline-02">Card heading</Heading>
```

---

## Layout

### Container

Constrains horizontal layout with responsive padding from layout tokens. Fluid up to `xl` (1536px), then centers at 90rem max-width.

| Prop | Type | Default |
|---|---|---|
| `as` | `string` | `"div"` |

```jsx
<Container>…</Container>
<Container as="section">…</Container>
```

---

### Grid

CSS Grid with responsive column counts and gutters from layout tokens. xs: 4 cols / sm: 8 cols / md–xl: 12 cols.

| Prop | Type | Default |
|---|---|---|
| `as` | `string` | `"div"` |

```jsx
<Container>
  <Grid>
    <div className={styles.spanLg8}>Main</div>
    <div className={styles.spanLg4}>Sidebar</div>
  </Grid>
</Container>
```

Span helper classes available via `layoutStyles` export. See [layout.md](./layout.md) for the full breakpoint and span reference.

---

### PageLayout

Full-page layout shell with sticky `Header` at the top and optional sticky `ActionBar` at the bottom. Scrollable main content fills the space between.

| Prop | Type | Notes |
|---|---|---|
| `header` | `React.ReactNode` | Typically `<Header>` |
| `actionBar` | `React.ReactNode` | Optional. Typically `<ActionBar>` |
| `children` | `React.ReactNode` | Scrollable page content |

```jsx
<PageLayout
  header={<Header logo={logo} navLinks={navLinks} />}
  actionBar={<ActionBar primaryAction={{ label: "Continue", onClick: handleContinue }} />}
>
  <Container><Grid>…</Grid></Container>
</PageLayout>
```

---

## Display

### Pill / PillGroup

Small label/badge element. `PillGroup` lays out multiple pills in a row with consistent gap.

```jsx
<Pill>New</Pill>
<Pill variant="success">Completed</Pill>

<PillGroup>
  <Pill>Action</Pill>
  <Pill>RPG</Pill>
</PillGroup>
```

---

### Avatar

Single user avatar image. Renders a circular image with a fallback initials state.

| Prop | Type | Notes |
|---|---|---|
| `src` | `string` | Image URL |
| `alt` | `string` | Alt text (use `""` if decorative) |
| `size` | `"sm"\|"md"\|"lg"\|"xl"` | `"lg"` | sm=24px, md=32px, lg=40px, xl=64px |

```jsx
<Avatar src="/avatar.png" alt="Jane Doe" size="lg" />
```

---

### AvatarStack

Overlapping row of avatars. Use to show a group of users.

```jsx
<AvatarStack>
  <Avatar src="/a.png" alt="Alice" size="md" />
  <Avatar src="/b.png" alt="Bob" size="md" />
  <Avatar src="/c.png" alt="Carol" size="md" />
</AvatarStack>
```

---

### Overlay

Full-screen overlay/scrim. Two variants: `"dim"` (dark semi-transparent backdrop) and `"blur"` (blurred backdrop). Accepts children for modal content positioned on top.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"dim"\|"blur"` | `"dim"` | |
| `open` | `boolean` | `true` | Controls visibility with fade animation |
| `onClose` | `function` | — | Called when clicking the overlay |

```jsx
<Overlay variant="dim" open={isOpen} onClose={() => setOpen(false)}>
  <div className={styles.dialog}>…</div>
</Overlay>
```

---

## Icons

See [iconography.md](./iconography.md) for the full icon name reference and setup guide.

### IconSprite

Mounts the SVG symbol spritesheet. **Must be rendered once at app root** for `<Icon>` to work.

```jsx
// In _app.jsx or layout.jsx — once
import { IconSprite } from "@canopy-ds/react";
<IconSprite />
```

---

### Icon

Renders a single icon from the sprite. Inherits `currentColor` for stroke color.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | required | Icon name (kebab-case) |
| `size` | `"sm"\|"md"\|"lg"\|"xl"` | `"md"` | 16 / 24 / 32 / 48px |
| `thickness` | `"sm"\|"md"\|"lg"\|"xl"` | `"md"` | Stroke width: 1 / 2 / 3 / 4px |
| `label` | `string` | — | Accessible label; omit for decorative icons |

```jsx
<Icon name="check" size="md" />
<Icon name="alert-circle" label="Warning" />
```

---

### ControllerButtonIcon

PlayStation controller button prompt icon. Used in `ActionBar` left-side action hints. Always decorative (`ariaHidden` defaults to `true`).

```jsx
<ControllerButtonIcon name="action-left" size="var(--canopy-ds-spacing-lg)" />
```

Available names: `action-down`, `action-left`, `action-right`, `action-up`, `down`, `home`, `l1`, `l2`, `left`, `left-stick`, `r1`, `r2`, `right`, `right-stick`, `select`, `start`, `up`

---

## Header

### Header

Full-width site header. Left slot: logo + nav. Right slot: any content (auth buttons, user block). Includes responsive mobile nav with hamburger.

| Prop | Type | Notes |
|---|---|---|
| `logo` | `React.ReactNode` | Brand element. Use `<LogoSwap>` for responsive swap. |
| `logoHref` | `string` | Wraps logo in a link when set |
| `navLinks` | `{ label, href?, active? }[]` | Nav items. Empty = no hamburger. |
| `leading` | `React.ReactNode` | Replaces entire left side (e.g. a back `<GlassButton>`) |
| `rightContent` | `React.ReactNode` | Right side slot |
| `avatar` | `string` | Avatar image URL; renders `<Avatar>` at end of right side |

```jsx
<Header
  logo={<LogoSwap logo={<SkillcadeLogo />} logoMark={<SkillcadeLogoMark />} />}
  logoHref="/"
  navLinks={[{ label: "Games", href: "/games", active: true }]}
  rightContent={<Button variant="primary">Log in</Button>}
/>
```

---

### LogoSwap

Swaps between a full logo and a compact mark based on screen width. Pass to `Header`'s `logo` prop.

```jsx
<LogoSwap
  logo={<SkillcadeLogo height={32} />}
  logoMark={<SkillcadeLogoMark height={32} />}
/>
```

---

### SkillcadeLogo / SkillcadeLogoMark

Brand SVG components. `SkillcadeLogo` is the full wordmark; `SkillcadeLogoMark` is the compact icon-only mark.

```jsx
<SkillcadeLogo height={32} />
<SkillcadeLogoMark height={32} />
```

---

### BalanceXpTicker

Animated balance and XP display for the header right slot. Plays a count-up animation when `animationTrigger` increments.

| Prop | Type | Notes |
|---|---|---|
| `oldBalance` | `string\|number` | Balance value before |
| `newBalance` | `string\|number` | Balance value after |
| `oldXp` | `string\|number` | XP value before |
| `newXp` | `string\|number` | XP value after |
| `animationTrigger` | `number` | Increment to replay animation |

---

### AddButton

Compact "add funds" button. Used inside the header right slot alongside `BalanceXpTicker`.

```jsx
<AddButton onClick={handleAddFunds} />
```

---

## App-Specific Components

These components encode product-specific UI patterns for the Skillcade gaming platform.

### ActionBar

Full-width bar with a gradient background. Left side: up to two informational controller-icon + label items. Right side: secondary + primary action buttons (or links).

| Prop | Type | Notes |
|---|---|---|
| `leftActions` | `{ icon: string, label: string }[]` | Up to 2 items. `icon` is a `ControllerButtonIcon` name. |
| `secondaryAction` | `{ label, href?, onClick?, disabled? }` | Left button on the right side |
| `primaryAction` | `{ label, href?, onClick?, disabled? }` | Right button on the right side |

```jsx
<ActionBar
  leftActions={[{ icon: "action-left", label: "Back" }]}
  secondaryAction={{ label: "Cancel", onClick: handleCancel }}
  primaryAction={{ label: "Confirm", onClick: handleConfirm }}
/>
```

---

### GameDetailsPanel

Panel displaying game metadata: title, image, entry fee, payout, player count, etc. Product-specific layout.

---

### EntryFeeCard / EntryFeeCardGrid

Card showing a single entry fee option (fee amount, payout, player count). `EntryFeeCardGrid` lays out multiple `EntryFeeCard` components in a responsive grid.

---

### QueueCard

Card shown while a user is in a matchmaking queue. Has four states: `"default"`, `"entryFeeChange"`, `"gameChange"`, `"lastResort"`. Each state expands the card with contextual actions (update, switch game, start over, keep waiting).

| Prop | Type | Notes |
|---|---|---|
| `state` | `"default"\|"entryFeeChange"\|"gameChange"\|"lastResort"` | Controls which expanded content is shown |
| `gameTitle` | `string` | |
| `gameImageSrc` | `string` | |
| `entryFee` | `string` | Formatted (e.g. `"$10"`) |
| `payout` | `string` | Formatted (e.g. `"$16.00"`) |
| `timerLabel` | `string` | Formatted (e.g. `"13 s"`, `"1 M 03 s"`) |

---

### QueueTimer

Circular countdown timer (ring shrinks as time runs out). **Responsive (mobile-first):** 274px (xs/sm) → 408px at md+. The centered "Join match $X" button is hidden on xs and sm; the consuming app should show the same CTA in a sticky bottom bar on those breakpoints.

---

### ResultsItem / ResultsList

`ResultsItem` is a single row in a game results list (player, score, placement, payout). Pass `stats={{ xp, currency }}` for built-in XP + prize display (formatted), or `rightContent` for custom right-side content. `ResultsList` is the container that lays out multiple `ResultsItem` components and passes `stats` (and `animateRightContent`) to the row that represents the current player.

---

## Utility Exports

### layoutStyles

CSS Module styles object for `Container` and `Grid` span helpers. Import to use responsive span classes on grid children.

```js
import { layoutStyles } from "@canopy-ds/react";
<div className={layoutStyles.spanLg8}>…</div>
```

### TYPOGRAPHY_VARIANTS / DEFAULT_HEADING_VARIANT_BY_LEVEL

Constants for valid typography variant names and the default variant per heading level. Used for validation and docs.

### formatNumber utilities

```js
import { parseNumber, formatXp, formatCurrency, formatAmountDisplay, formatEntryAmountDisplay } from "@canopy-ds/react";
```

Number formatting helpers used throughout the platform (XP display, currency formatting, entry fee display).

---

## Do / Don't

| Do | Don't |
|---|---|
| Import from the package barrel (`@canopy-ds/react`) | Import directly from deep source paths (`@canopy-ds/react/src/Button/Button.jsx`) |
| Mount `<IconSprite />` once at app root | Forget `<IconSprite />` and wonder why icons are blank |
| Use `href` on `Button`/`GlassButton` for navigation | Use `onClick` with `window.location` for navigation — use `href` |
| Pass `aria-label` on icon-only `GlassButton` | Use `GlassButton iconOnly` without an accessible label |
| Use `<PageLayout>` as the top-level shell with `<Header>` and optional `<ActionBar>` | Build page shells manually with position sticky CSS |

```jsx
/* Do: import from barrel */
import { Button, Icon, IconSprite, PageLayout } from "@canopy-ds/react";

/* Don't: deep path imports */
import { Button } from "@canopy-ds/react/src/Button/Button.jsx";
import { Icon } from "@canopy-ds/react/src/icons/Icon.jsx";
```

```jsx
/* Do: href for navigation, aria-label for icon-only */
<Button variant="secondary" href="/back">Back</Button>
<GlassButton size="md" iconOnly aria-label="Go back">
  <Icon name="arrow-left" />
</GlassButton>

/* Don't: onClick navigation, icon-only without label */
<Button variant="secondary" onClick={() => (window.location.href = "/back")}>Back</Button>
<GlassButton size="md" iconOnly>
  <Icon name="arrow-left" />   {/* no aria-label — inaccessible */}
</GlassButton>
```
