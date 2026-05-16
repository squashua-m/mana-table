import type { DeckAllocation } from "../utils/buildDeck";

// One-shot handoff from the deck-builder screen to the canvas: the builder
// stashes the finished allocation, the canvas consumes it on mount and clears
// the slot so a future canvas re-mount doesn't double-spawn.
let pending: DeckAllocation | null = null;

export function setPendingDeck(deck: DeckAllocation): void {
  pending = deck;
}

export function consumePendingDeck(): DeckAllocation | null {
  const p = pending;
  pending = null;
  return p;
}

export function clearPendingDeck(): void {
  pending = null;
}
