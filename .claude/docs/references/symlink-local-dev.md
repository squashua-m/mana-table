# Symlink Local Dev — Canopy Design System

Use a symlink when you want a consuming app to pull `@canopy-ds/react` or `@canopy-ds/tokens` directly from the local repo instead of from the npm registry. This is useful for:

- Testing unreleased changes in a real app before publishing
- Iterating on components while seeing live results in a consuming app
- Avoiding the publish/install cycle during development

There are two approaches: **`npm link`** (global symlink registry) and **`file:` path in `package.json`** (explicit, shareable). Both are covered below.

---

## Prerequisites

`@canopy-ds/react` points directly to `src/` so no build step is required. `@canopy-ds/tokens` serves from `dist/` — run the token build once before linking so the CSS and JS artifacts exist:

```bash
# From repo root (only needed for @canopy-ds/tokens)
npm run tokens:build
```

---

## Approach A — `npm link` (global registry)

### Step 1 — Register the package(s) globally

Run inside each package directory you want to link:

```bash
# Register @canopy-ds/react
cd /path/to/canopy-ds/packages/react
npm link

# Register @canopy-ds/tokens (if also needed)
cd /path/to/canopy-ds/packages/tokens
npm link
```

### Step 2 — Link into the consuming app

```bash
cd /path/to/your-app
npm link @canopy-ds/react
npm link @canopy-ds/tokens   # if needed
```

### Step 3 — Fix the React duplicate instance (Vite apps)

Because the symlinked package has its own `node_modules`, Vite may resolve two separate copies of React — one from the DS package and one from your app. This causes a runtime crash:

> _Hooks can only be called inside of the body of a function component._

Fix it by aliasing React in your app's `vite.config.js` to always use the app's own copy:

```js
// vite.config.js (consuming app)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
  },
});
```

### Step 4 — Unlink when done

```bash
# In the consuming app
cd /path/to/your-app
npm unlink @canopy-ds/react --no-save
npm unlink @canopy-ds/tokens --no-save
npm install   # restore the registry version

# In the DS repo (optional — removes global registration)
cd /path/to/canopy-ds/packages/react
npm unlink
```

---

## Approach B — `file:` path in `package.json` (recommended for teams)

Edit the consuming app's `package.json` to point directly at the local repo path. No global registration step needed, and the path is committed so the whole team uses it.

```json
{
  "dependencies": {
    "@canopy-ds/react": "file:../canopy-ds/packages/react",
    "@canopy-ds/tokens": "file:../canopy-ds/packages/tokens"
  }
}
```

Then install:

```bash
cd /path/to/your-app
npm install
```

npm will create a symlink in `node_modules/@canopy-ds/` pointing at the local package directories.

**Apply the same Vite alias** from Approach A, Step 3, to prevent duplicate React.

### Reverting to the registry version

Change the version back in `package.json`:

```json
{
  "dependencies": {
    "@canopy-ds/react": "^1.1.3",
    "@canopy-ds/tokens": "^1.1.3"
  }
}
```

Then run `npm install` to restore the npm version and remove the symlink.

---

## Watching for changes

With either approach, edits to `packages/react/src/` are reflected immediately on next HMR reload — no rebuild needed because the package resolves directly from source.

For token changes (`packages/tokens/`), run the watcher so CSS and JS artifacts are kept up to date:

```bash
# From repo root
npm run tokens:watch
```

---

## Do / Don't

| Do | Don't |
|----|-------|
| Use `file:` path for team projects — it's explicit and committed | Use `npm link` in CI or shared environments (global state, fragile) |
| Add the Vite React alias whenever symlinking any React package | Skip the alias — duplicate React causes hook errors at runtime |
| Run `tokens:build` once before linking `@canopy-ds/tokens` | Link tokens without building — `dist/` may be empty or stale |
| Revert `package.json` and run `npm install` when done | Leave `file:` paths in `package.json` when publishing the consuming app |
| Run `tokens:watch` while iterating on token values | Manually re-run the token build every time a token changes |

```bash
# Do: file: path, then install
# package.json → "@canopy-ds/react": "file:../canopy-ds/packages/react"
npm install

# Don't: forget the Vite alias — you'll get hook crashes
# resolve: { alias: { react: ... } }  ← required
```
