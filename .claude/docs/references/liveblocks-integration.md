# PRD: Liveblocks Sync Layer for tldraw (MtG Sandbox)

## 1. Objective
Establish a persistent, multi-user synchronization layer using **Liveblocks** to power a shared **tldraw** infinite canvas. This document focuses strictly on the infrastructure required to sync the canvas state and player presence, without implementing specific card game logic or UI.

---

## 2. Technical Stack
* **Real-time Engine:** Liveblocks (`@liveblocks/client`, `@liveblocks/react`)
* **Canvas Engine:** tldraw SDK
* **Framework:** React / Next.js

---

## 3. Infrastructure Requirements

### 3.1 Presence (Real-time Awareness)
* **Cursor Sync:** Synchronize `x` and `y` coordinates for all active users.
* **User Metadata:** Support for player `name` and `color` to identify cursors.
* **Selection State:** Sync which shapes/objects are currently "selected" to provide visual feedback and prevent edit conflicts.

### 3.2 Storage (Persistent State)
The tldraw store must be mirrored in Liveblocks **Storage** to ensure the battlefield state is preserved across sessions.
* **Shapes Map:** A `LiveMap<string, LiveObject<any>>` to store all tldraw shape data.
* **Bindings Map:** A `LiveMap<string, LiveObject<any>>` to store connections (arrows/lines) between objects.
* **Consistency:** Use "Last Write Wins" (LWW) conflict resolution for concurrent movement of the same object.

### 3.3 UI & Branding Configuration
* **Liveblocks Badge:** Set `badgeLocation="bottom-left"` in the `LiveblocksProvider`.
* **tldraw Watermark:** Acknowledge standard bottom-right placement; ensure no custom UI elements overlap these two corners.

---

## 4. Implementation Instructions for Claude

Please implement the following synchronization logic:

1. **`liveblocks.config.ts`**: 
   - Define `Presence` with a `cursor` object.
   - Define `Storage` with a `records` object to house the tldraw store.

2. **Store Sync Hook**:
   - Create a mechanism to listen to tldraw `store.listen` events.
   - **Outbound:** Update Liveblocks Storage when local tldraw shapes change.
   - **Inbound:** Update the local tldraw store when remote changes are received from Liveblocks.

3. **Room Setup**:
   - Wrap the application in `LiveblocksProvider` (with bottom-left badge) and `RoomProvider`.
   - Initialize the tldraw `store` only once the Liveblocks storage has finished loading.

---

## 5. Success Criteria
* **Visual Identity:** Each player's cursor and selection box are clearly distinguishable by their assigned token color.
* **State Persistence:** Refreshing the browser preserves the position of all elements on the canvas.
* **Branding Symmetry:** Liveblocks badge (bottom-left) and tldraw watermark (bottom-right) are both visible and not overlapping.
* **Real-time Cursors:** Opponent cursors are visible and move smoothly (<100ms latency).