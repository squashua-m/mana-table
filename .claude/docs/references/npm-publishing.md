# NPM publishing — Canopy Design System

How to publish `@canopy-ds/react` (and optionally other workspace packages) to GitHub Package Registry. Use this when you’ve cut a release and want the consuming app to install the new version.

---

## Prerequisites

1. **GitHub Personal Access Token (PAT)** with `write:packages` (and `read:packages` if you install from the registry). Create under: GitHub → Settings → Developer settings → Personal access tokens.
2. **Repo `.npmrc`** (already in this repo) scopes the design system scope to GitHub:
   ```ini
   @canopy-ds:registry=https://npm.pkg.github.com
   ```
3. **Publish config** in the package: `packages/react/package.json` has `"publishConfig": { "registry": "https://npm.pkg.github.com" }` so `npm publish` uses GitHub Packages.

---

## 1. Log in to GitHub Package Registry

One-time per machine (or when your token expires):

```bash
npm login --registry=https://npm.pkg.github.com
```

- **Username:** your GitHub username  
- **Password:** your PAT (not your GitHub password)  
- **Email:** your email (or leave default)

---

## 2. Bump the version

Only the package you publish needs a version bump. For `@canopy-ds/react`:

- **Patch (small):** bug fixes, small tweaks — e.g. `1.0.7` → `1.0.8`  
  ```bash
  cd packages/react && npm version patch
  ```
- **Minor:** new features, non-breaking — e.g. `1.0.7` → `1.1.0`  
  ```bash
  cd packages/react && npm version minor
  ```
- **Major:** breaking changes — e.g. `1.0.7` → `2.0.0`  
  ```bash
  cd packages/react && npm version major
  ```

You can also edit `packages/react/package.json` and set `"version": "1.0.8"` (or whatever) by hand, then commit the change.

---

## 3. Publish the package

**Recommended:** Publish from the **package directory** so the tarball is built from that context (avoids incomplete packs seen with some npm workspace publish flows):

```bash
cd packages/react
npm publish
```

From the repo root (alternative):

```bash
cd /path/to/canopy-ds
npm publish -w @canopy-ds/react
```

Before every publish, `prepublishOnly` runs and verifies that required paths (e.g. `src/Button`, `src/styles.css`, `src/index.js`) exist so an incomplete package is never published.

That publishes the current version in `packages/react/package.json` to GitHub Packages. The consuming app can then run `npm install @canopy-ds/react@1.0.8` (or bump the version in its `package.json` and run `npm install`).

---

## 4. Commit and push the version bump

If you used `npm version patch|minor|major`, it created a commit and a git tag. Push both:

```bash
git push && git push --tags
```

If you edited `package.json` by hand, commit the version change and push as usual.

---

## Quick reference

| Step            | Command |
|-----------------|---------|
| Login           | `npm login --registry=https://npm.pkg.github.com` |
| Patch bump      | `cd packages/react && npm version patch` |
| Publish         | From package dir: `cd packages/react && npm publish` (recommended so the pack is complete) |
| Push + tags     | `git push && git push --tags` |

---

## Optional: add a publish script at root

To avoid typing the workspace flag, add to the **root** `package.json`:

```json
"scripts": {
  "publish:react": "npm publish -w @canopy-ds/react"
}
```

Then from the repo root:

```bash
npm run publish:react
```

You still need to bump the version in `packages/react` (e.g. `npm version patch` in that directory) before running this.
