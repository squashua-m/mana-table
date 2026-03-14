# Storybook — Canopy Design System

> Format: CSF3 (Component Story Format 3 — named exports, no `storyFn` wrappers).
> Files: `ComponentName.stories.jsx` co-located with the component.
> Title convention: `"Components/ComponentName"` or `"Layout/ComponentName"`.

---

## File Structure

Every component has a stories file co-located in its folder:

```
src/
└── Button/
    ├── Button.jsx
    ├── Button.module.css
    ├── Button.stories.jsx   ← here
    └── index.js
```

---

## Default Export (Story Metadata)

The default export configures the component in Storybook. Required fields: `title`, `component`. Common optional fields: `parameters`, `argTypes`, `args`.

```jsx
export default {
  title: "Components/Button",          // Required. Use "Components/Name" or "Layout/Name"
  component: Button,                   // Required. The component being documented.
  parameters: {                        // Optional. Storybook-level settings.
    layout: "centered",                // "centered" | "fullscreen" | "padded" (default)
    backgrounds: { default: "dark" },  // Use "dark" for glass/dark-bg components
  },
  argTypes: {                          // Controls schema for each prop.
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "critical", "caution"],
      description: "Visual style of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: {                              // Default arg values shared across all stories.
    children: "Button",
    variant: "primary",
    size: "lg",
    disabled: false,
  },
};
```

### `parameters.layout` values

| Value          | Use for                                                    |
|----------------|------------------------------------------------------------|
| `"centered"`   | Default. Component floats in center of canvas. Good for most components. |
| `"fullscreen"` | Component fills the full canvas. Use for `Header`, `ActionBar`, `PageLayout`, `Overlay`. |
| `"padded"`     | Canvas has padding but component is not centered.          |

### `parameters.backgrounds.default`

Set `backgrounds: { default: "dark" }` for any component designed for dark backgrounds: glass buttons, overlays, game-context panels. This ensures Storybook renders on the correct background color by default.

---

## Story Exports (CSF3)

### Playground story (required)

Every component file should have a `Playground` story as the primary interactive story. When all args come from the default export, the story can be an empty object:

```jsx
export const Playground = {};
```

When the component needs a render function (e.g. to wrap in a container or provide structured children):

```jsx
export const Playground = {
  render: (args) => (
    <GlassButton {...args}>
      <Icon name="chevron-left" size={24} />
    </GlassButton>
  ),
};
```

### Static demonstration stories

For showing multiple variants at once. Use a `render` function; do not rely on args since the values are hardcoded.

```jsx
export const AllVariants = {
  name: "All Variants",           // Optional display name (overrides the export name)
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="caution">Caution</Button>
      <Button variant="critical">Critical</Button>
    </div>
  ),
};
```

### Stories with descriptions

Add a story-level description when the behavior isn't obvious from the name:

```jsx
export const AsLink = {
  name: "As link (href)",
  parameters: {
    docs: {
      description: {
        story: "When href is set, Button renders as an anchor. Use for navigation; same styles as button.",
      },
    },
  },
  render: () => (
    <Button variant="primary" href="#">Primary link</Button>
  ),
};
```

---

## Required Stories Per Component

Every component file must have at minimum:

| Story name          | Purpose                                                    |
|---------------------|------------------------------------------------------------|
| `Playground`        | Primary interactive story with all controls wired up       |
| State variants      | All meaningful visual states (disabled, loading, error, etc.) |
| All enum variants   | If the component has `variant`, `size`, or similar — show all options together |

Optional but encouraged:

| Story name          | Purpose                                                    |
|---------------------|------------------------------------------------------------|
| `AsLink`            | When component supports `href` prop                        |
| Named behavior      | Anything non-obvious (e.g. `DrillDown`, `LoggedIn`)        |

---

## Inline Style Rules for Stories

Stories may use inline styles for layout scaffolding (flex, gap, alignment) — but only using tokens:

```jsx
// CORRECT — token-based spacing in story layout
<div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)", alignItems: "center" }}>

// WRONG — hardcoded value in story
<div style={{ gap: "8px" }}>
```

This rule applies only to story wrapper divs. Do not put inline styles on the component under test.

---

## argTypes Patterns

### Enum props (select control)

```jsx
argTypes: {
  variant: {
    control: "select",
    options: ["primary", "secondary", "tertiary"],
    description: "Visual style",
  },
}
```

### Enum with custom labels

```jsx
argTypes: {
  leftActionsVariant: {
    options: ["none", "one", "both"],
    control: { type: "select", labels: { none: "None", one: "One action", both: "Both" } },
    description: "How many left items to show",
  },
}
```

### Boolean props

```jsx
argTypes: {
  disabled: { control: "boolean" },
  iconOnly: { control: "boolean" },
}
```

### Text content

```jsx
argTypes: {
  children: { control: "text" },
}
```

### Number with range

```jsx
argTypes: {
  animationTrigger: {
    description: "Increment to replay the animation",
    control: { type: "number", min: 0, step: 1 },
  },
}
```

---

## Title Hierarchy

Organize stories in Storybook's sidebar using the `/` separator in `title`:

| Pattern                     | Use for                                          |
|-----------------------------|--------------------------------------------------|
| `"Components/Button"`       | Standard UI components                           |
| `"Components/GlassButton"`  | Components with a specific design variant        |
| `"Layout/Grid"`             | Layout primitives (`Container`, `Grid`)          |
| `"Layout/PageLayout"`       | Full-page layout components                      |
| `"Typography"`              | Typography showcase (no sub-group needed)        |

---

## Story Naming Conventions

| Export name            | Displayed as                 | Notes                                  |
|------------------------|------------------------------|----------------------------------------|
| `Playground`           | "Playground"                 | Primary interactive story              |
| `AllVariants`          | "All Variants"               | Use `name` property to override        |
| `DisabledStates`       | "Disabled States"            | Groups all disabled variants together  |
| `AsLink`               | `name: "As link (href)"`     | Describe the behavior in name          |
| `DrillDown`            | `name: "Drill-down (leading)"`| Use readable phrases, not camelCase    |

Always set `name` on stories where the PascalCase export name would read awkwardly.

---

## Complete Example (Reference)

```jsx
import { Button } from "./Button";

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "tertiary", "critical", "caution"] },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "lg",
    disabled: false,
  },
};

export const Playground = {};

export const AllVariants = {
  name: "All Variants",
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="caution">Caution</Button>
      <Button variant="critical">Critical</Button>
    </div>
  ),
};

export const AllSizes = {
  name: "All Sizes",
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)", alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">X-Large</Button>
    </div>
  ),
};

export const DisabledStates = {
  name: "Disabled States",
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)", flexWrap: "wrap" }}>
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
    </div>
  ),
};

export const AsLink = {
  name: "As link (href)",
  parameters: {
    docs: { description: { story: "Renders as <a> when href is set. Same styles as button." } },
  },
  render: () => (
    <Button variant="primary" href="#">Primary link</Button>
  ),
};
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Always include a `Playground` story as the first export | Skip `Playground` and only write static render stories |
| Use `parameters.layout: "fullscreen"` for full-width components | Use `"centered"` for `Header`, `ActionBar`, or `PageLayout` — they need full canvas |
| Use token-based spacing in story layout wrappers | Hardcode pixel values (`gap: "8px"`) in story inline styles |
| Set `name` on stories where the PascalCase export name reads awkwardly | Leave `AsLink` displaying as "As Link" or `AllVariants` as "All Variants" (no name override) |
| Add a story for every meaningful visual state (disabled, loading, error) | Only write `Playground` and skip variant/state coverage |

```jsx
/* Do: Playground first, token spacing in render */
export const Playground = {};

export const AllVariants = {
  name: "All Variants",
  render: () => (
    <div style={{ display: "flex", gap: "var(--canopy-ds-spacing-sm)" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  ),
};

/* Don't: no Playground, hardcoded gap */
export const Primary = { render: () => <Button variant="primary">Primary</Button> };
export const AllVariants = {
  render: () => (
    <div style={{ gap: "8px" }}>   {/* hardcoded — should be a token */}
      <Button variant="primary">Primary</Button>
    </div>
  ),
};
```

```jsx
/* Do: fullscreen for full-width components */
export default {
  title: "Components/Header",
  component: Header,
  parameters: { layout: "fullscreen" },
};

/* Don't: centered for a full-width component */
export default {
  title: "Components/Header",
  component: Header,
  parameters: { layout: "centered" },  /* Header will be clipped or misrepresented */
};
```
