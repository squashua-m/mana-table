# Project: MTG Multiplayer Infinite Canvas (MVP)

## 1. Core Objectives
Build a high-performance, multiplayer-first infinite canvas for playing Magic: The Gathering.
- **Infinite Canvas:** Drag, zoom, and pan using the `tldraw` SDK.
- **Card Mechanics:** Support for flipping (front/back) and rotating (tapping/untapping).
- **Multiplayer:** Real-time state synchronization via `Liveblocks` or `yjs`.
- **Data Integration:** Fetch random card data from the Scryfall API for testing.

## 2. Technical Stack
| Category | Tool/Library |
| :--- | :--- |
| **Framework** | React (Next.js) |
| **Canvas Engine** | `tldraw` SDK |
| **Multiplayer** | `Liveblocks` (Storage + Presence) |
| **MTG Data** | `Scryfall API` (Direct REST calls) |

## 3. MVP Features & UI Logic

### A. The "Random Spawn" Button
- **Placement:** Pinned to the **Bottom-Left** of the viewport using `position: fixed`.
- **Component:** Uses the existing pre-defined "glass button" component.
- **Function:** 1. On click, call: `https://api.scryfall.com/cards/random`.
  2. Parse the `image_uris.normal` and `name` from the response.
  3. Create a new `MtgCard` shape at the center of the current `editor.getViewportScreenCenter()`.

### B. Multiplayer Cursors & Labels
- **Visuals:** Each player is assigned a random hex color upon joining.
- **Cursor UI:** - The cursor icon (SVG) should be tinted with the player's random color.
  - A pill-shaped **Username Tag** must be rendered directly underneath the cursor.
  - **Label:** "Planeswalker [Random ID]" (Placeholder for now).
- **Sync:** Cursor coordinates must be synced in real-time using the multiplayer "Presence" layer.

### C. Custom Shape: `MtgCard`
- **Data Schema:** - `imageUrl`: The Scryfall image link.
  - `isFlipped`: Boolean to toggle between card front and back.
  - `rotation`: Uses `tldraw` native rotation (90 deg = Tapped).
- **Interactions:** Use the `tldraw` context menu or a double-click gesture to toggle the `isFlipped` state.

## 4. Engineering Implementation Notes

### Multiplayer Presence Schema
```typescript
type Presence = {
  cursor: { x: number; y: number } | null;
  color: string; // Random Hex
  username: string; // "Planeswalker #1234"
};
