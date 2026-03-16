import { createShapeId, type Editor, type TLShapeId } from "tldraw";
import * as stackStore from "../stores/stackStore";
import type { HandCard } from "../stores/handStore";
import { shuffleArray } from "../utils/deckOperations";

// Y offset between cards in a graveyard pile (tight stack)
const GRAVEYARD_OFFSET = -2;
// Y offset for loose stacks so the bottom card's label remains visible
const LABEL_OFFSET = 40;

/** Returns true if ≥50% of `a`'s area is covered by `b`. */
function boundsOverlap(
  a: { maxX: number; maxY: number; minX: number; minY: number; w: number; h: number },
  b: { maxX: number; maxY: number; minX: number; minY: number; w: number; h: number }
): boolean {
  const ix = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const iy = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  const intersection = ix * iy;
  const areaA = a.w * a.h;
  return areaA > 0 && intersection / areaA >= 0.5;
}

/** Positions cards in a graveyard stack, groups them, and registers the stack. */
export function applyGraveyardStack(
  editor: Editor,
  cardOrder: string[],
  anchorX: number,
  anchorY: number,
  isGraveyard: boolean
): void {
  editor.updateShapes(
    cardOrder.map((id, i) => ({
      id: id as TLShapeId,
      type: "mtg-card" as const,
      x: anchorX,
      y: anchorY + i * GRAVEYARD_OFFSET,
    }))
  );

  const groupId = createShapeId();

  // Register BEFORE grouping so components render with correct isTopCard
  // on the first re-render triggered by the group operation.
  stackStore.registerStack(groupId, { type: "graveyard", cardOrder });
  if (isGraveyard) stackStore.setGraveyard(groupId);

  if (cardOrder.length === 1) {
    // editor.groupShapes no-ops for a single shape — create the group manually.
    editor.createShape({
      id: groupId,
      type: "group",
      x: anchorX,
      y: anchorY,
      props: {},
      meta: {},
    });
    // reparentShapes preserves world position by adjusting local coords.
    editor.reparentShapes([cardOrder[0] as TLShapeId], groupId);
  } else {
    editor.groupShapes(cardOrder as TLShapeId[], { groupId });
    editor.sendToBack([cardOrder[0] as TLShapeId]);
    for (let i = 1; i < cardOrder.length; i++) {
      editor.bringToFront([cardOrder[i] as TLShapeId]);
    }
  }
}

/**
 * Find the first mtg-card that meaningfully overlaps `shapeId` (≥50% intersection).
 * Returns the overlapping card's shape ID or null if none found.
 */
export function findNearestOverlappingCard(editor: Editor, shapeId: string): string | null {
  const bounds = editor.getShapePageBounds(shapeId as TLShapeId);
  if (!bounds) return null;

  for (const shape of editor.getCurrentPageShapes()) {
    if (shape.type !== "mtg-card" || shape.id === shapeId) continue;
    const candidateBounds = editor.getShapePageBounds(shape.id);
    if (!candidateBounds) continue;
    if (boundsOverlap(bounds, candidateBounds)) return shape.id;
  }
  return null;
}

/**
 * Find ALL mtg-cards that meaningfully overlap `shapeId` (≥50% intersection).
 * Skips cards already inside a stack/graveyard group.
 */
export function findAllOverlappingCards(editor: Editor, shapeId: string): string[] {
  const bounds = editor.getShapePageBounds(shapeId as TLShapeId);
  if (!bounds) return [];

  const results: string[] = [];
  for (const shape of editor.getCurrentPageShapes()) {
    if (shape.type !== "mtg-card" || shape.id === shapeId) continue;
    // Skip cards already grouped into a stack
    const parentId = shape.parentId as string;
    if (typeof parentId === "string" && parentId.startsWith("shape:")) continue;
    const candidateBounds = editor.getShapePageBounds(shape.id);
    if (!candidateBounds) continue;
    if (boundsOverlap(bounds, candidateBounds)) results.push(shape.id);
  }
  return results;
}

/** Move `cardId` to target's position + LABEL_OFFSET Y, then bring to front. */
export function stackOnTop(editor: Editor, cardId: string, targetCardId: string): void {
  const target = editor.getShape(targetCardId as TLShapeId);
  if (!target) return;
  editor.updateShape({
    id: cardId as TLShapeId,
    type: "mtg-card" as const,
    x: target.x,
    y: target.y + LABEL_OFFSET,
  });
  editor.bringToFront([cardId as TLShapeId]);
}

/** Move `cardId` to target's position - LABEL_OFFSET Y, then send to back. */
export function tuckUnderneath(editor: Editor, cardId: string, targetCardId: string): void {
  const target = editor.getShape(targetCardId as TLShapeId);
  if (!target) return;
  editor.updateShape({
    id: cardId as TLShapeId,
    type: "mtg-card" as const,
    x: target.x,
    y: target.y - LABEL_OFFSET,
  });
  editor.sendToBack([cardId as TLShapeId]);
}

/**
 * Create a new graveyard group from 1+ card IDs.
 * Cards are sorted by current Y position (topmost = index 0 = bottom of stack).
 */
export function createGraveyard(editor: Editor, cardIds: string[]): void {
  const withY = cardIds.map((id) => {
    const shape = editor.getShape(id as TLShapeId);
    return { id, y: shape?.y ?? 0, x: shape?.x ?? 0 };
  });
  withY.sort((a, b) => a.y - b.y);

  const cardOrder = withY.map((c) => c.id);
  const anchorX = withY.reduce((sum, c) => sum + c.x, 0) / withY.length;
  const anchorY = withY.reduce((sum, c) => sum + c.y, 0) / withY.length;

  editor.updateShapes(
    cardOrder.map((id) => ({ id: id as TLShapeId, type: "mtg-card" as const, props: { isTapped: false, isFlipped: false } }))
  );

  applyGraveyardStack(editor, cardOrder, anchorX, anchorY, true);
}

/**
 * Add `cardId` to the existing graveyard (card goes on top).
 * Dissolves the current group, re-forms with the new card appended.
 */
export function addCardToGraveyard(editor: Editor, cardId: string): void {
  const graveyardGroupId = stackStore.getGraveyardGroupId();
  if (!graveyardGroupId) return;

  const meta = stackStore.getStack(graveyardGroupId);
  if (!meta) return;

  const baseOrder = meta.cardOrder.filter((id) => id !== cardId);
  const cardOrder = [...baseOrder, cardId];

  // Cards are inside a group — use page bounds for world-space coordinates.
  const anchorBounds = editor.getShapePageBounds(baseOrder[0] as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  stackStore.removeStack(graveyardGroupId);
  editor.ungroupShapes([graveyardGroupId as TLShapeId]);

  editor.updateShape({ id: cardId as TLShapeId, type: "mtg-card" as const, props: { isTapped: false, isFlipped: false } });

  applyGraveyardStack(editor, cardOrder, anchorX, anchorY, true);
}

/** Dissolve the current graveyard group. */
export function undoGraveyard(editor: Editor): void {
  const graveyardGroupId = stackStore.getGraveyardGroupId();
  if (!graveyardGroupId) return;
  stackStore.removeStack(graveyardGroupId);
  editor.ungroupShapes([graveyardGroupId as TLShapeId]);
}

// ─── Deck operations ──────────────────────────────────────────────────────────

/** Positions cards in a deck stack, groups them, and registers the deck. */
function applyDeckStack(
  editor: Editor,
  cardOrder: string[],
  anchorX: number,
  anchorY: number,
  name?: string
): void {
  editor.updateShapes(
    cardOrder.map((id, i) => ({
      id: id as TLShapeId,
      type: "mtg-card" as const,
      x: anchorX,
      y: anchorY + i * GRAVEYARD_OFFSET,
    }))
  );

  const groupId = createShapeId();

  stackStore.registerStack(groupId, { type: "deck", cardOrder, name });
  stackStore.setDeck(groupId);

  if (cardOrder.length === 1) {
    editor.createShape({
      id: groupId,
      type: "group",
      x: anchorX,
      y: anchorY,
      props: {},
      meta: {},
    });
    editor.reparentShapes([cardOrder[0] as TLShapeId], groupId);
  } else {
    editor.groupShapes(cardOrder as TLShapeId[], { groupId });
    editor.sendToBack([cardOrder[0] as TLShapeId]);
    for (let i = 1; i < cardOrder.length; i++) {
      editor.bringToFront([cardOrder[i] as TLShapeId]);
    }
  }
}

/**
 * Create a new deck group from 1+ card IDs.
 * All cards are set face-down (isFlipped: true) to show card backs.
 */
export function createDeck(editor: Editor, cardIds: string[], deckName: string): void {
  const withPos = cardIds.map((id) => {
    const shape = editor.getShape(id as TLShapeId);
    return { id, y: shape?.y ?? 0, x: shape?.x ?? 0 };
  });
  withPos.sort((a, b) => a.y - b.y);

  const cardOrder = withPos.map((c) => c.id);
  const anchorX = withPos[0].x;
  const anchorY = withPos[0].y;

  editor.updateShapes(
    cardOrder.map((id) => ({
      id: id as TLShapeId,
      type: "mtg-card" as const,
      props: { isTapped: false, isFlipped: true },
    }))
  );

  applyDeckStack(editor, cardOrder, anchorX, anchorY, deckName);
}

/**
 * Add `cardId` to the existing deck at top or bottom.
 * Card is set face-down (isFlipped: true).
 */
export function addCardToDeck(
  editor: Editor,
  cardId: string,
  position: "top" | "bottom"
): void {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return;

  const meta = stackStore.getStack(deckGroupId);
  if (!meta) return;

  const baseOrder = meta.cardOrder.filter((id) => id !== cardId);
  const cardOrder =
    position === "top" ? [...baseOrder, cardId] : [cardId, ...baseOrder];

  const anchorBounds = editor.getShapePageBounds(baseOrder[0] as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);

  editor.updateShape({
    id: cardId as TLShapeId,
    type: "mtg-card" as const,
    props: { isTapped: false, isFlipped: true },
  });

  applyDeckStack(editor, cardOrder, anchorX, anchorY, meta.name);
}

/**
 * Remove the top card from the deck and return its data as a HandCard.
 * The card shape is deleted from the canvas (it moves to the hand).
 * Returns null if no deck or deck is empty.
 */
export function drawFromDeck(editor: Editor): HandCard | null {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return null;

  const meta = stackStore.getStack(deckGroupId);
  if (!meta || meta.cardOrder.length === 0) return null;

  const topCardId = meta.cardOrder.at(-1)!;
  const remaining = meta.cardOrder.slice(0, -1);

  const topCardShape = editor.getShape(topCardId as TLShapeId) as
    | { props: { imageUrl: string; cardName: string } }
    | undefined;
  if (!topCardShape) return null;

  const { imageUrl, cardName } = topCardShape.props;

  const anchorBounds =
    remaining.length > 0
      ? editor.getShapePageBounds(remaining[0] as TLShapeId)
      : editor.getShapePageBounds(topCardId as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);

  if (remaining.length > 0) {
    applyDeckStack(editor, remaining, anchorX, anchorY, meta.name);
  }

  editor.deleteShapes([topCardId as TLShapeId]);

  return { id: crypto.randomUUID(), imageUrl, cardName };
}

/**
 * Draw up to `count` cards from the top of the deck.
 * Returns an array of HandCards (in draw order, first drawn first).
 */
export function drawManyFromDeck(editor: Editor, count: number): HandCard[] {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return [];

  const meta = stackStore.getStack(deckGroupId);
  if (!meta || meta.cardOrder.length === 0) return [];

  const actualCount = Math.min(count, meta.cardOrder.length);
  const drawnIds = meta.cardOrder.slice(-actualCount).reverse(); // top first
  const remaining = meta.cardOrder.slice(0, -actualCount);

  const drawnCards: HandCard[] = drawnIds.map((id) => {
    const shape = editor.getShape(id as TLShapeId) as
      | { props: { imageUrl: string; cardName: string } }
      | undefined;
    return {
      id: crypto.randomUUID(),
      imageUrl: shape?.props.imageUrl ?? "",
      cardName: shape?.props.cardName ?? "",
    };
  });

  const anchorBounds =
    remaining.length > 0
      ? editor.getShapePageBounds(remaining[0] as TLShapeId)
      : editor.getShapePageBounds(meta.cardOrder[0] as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);

  if (remaining.length > 0) {
    applyDeckStack(editor, remaining, anchorX, anchorY, meta.name);
  }

  editor.deleteShapes(drawnIds as TLShapeId[]);

  return drawnCards;
}

/**
 * Remove the top card from the deck and send it to the graveyard.
 */
export function millFromDeck(editor: Editor): void {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return;

  const meta = stackStore.getStack(deckGroupId);
  if (!meta || meta.cardOrder.length === 0) return;

  const topCardId = meta.cardOrder.at(-1)!;
  const remaining = meta.cardOrder.slice(0, -1);

  const anchorBounds =
    remaining.length > 0
      ? editor.getShapePageBounds(remaining[0] as TLShapeId)
      : editor.getShapePageBounds(topCardId as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);

  // Show face-up in graveyard
  editor.updateShape({
    id: topCardId as TLShapeId,
    type: "mtg-card" as const,
    props: { isFlipped: false },
  });

  if (remaining.length > 0) {
    applyDeckStack(editor, remaining, anchorX, anchorY, meta.name);
  }

  if (stackStore.hasGraveyard()) {
    addCardToGraveyard(editor, topCardId);
  } else {
    createGraveyard(editor, [topCardId]);
  }
}

/**
 * Shuffle the deck — randomizes card order and repositions shapes.
 */
export function shuffleDeck(editor: Editor): void {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return;

  const meta = stackStore.getStack(deckGroupId);
  if (!meta || meta.cardOrder.length === 0) return;

  const anchorBounds = editor.getShapePageBounds(meta.cardOrder[0] as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  const shuffled = shuffleArray([...meta.cardOrder]);

  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);

  applyDeckStack(editor, shuffled, anchorX, anchorY, meta.name);
}

/**
 * Remove the top card from any registered stack (graveyard or generic) and
 * return its data as a HandCard. The card shape is deleted from the canvas.
 * Use drawFromDeck() for deck-type stacks instead.
 * Returns null if stack not found or empty.
 */
export function removeTopCardFromStack(editor: Editor, groupId: string): HandCard | null {
  const meta = stackStore.getStack(groupId);
  if (!meta || meta.cardOrder.length === 0) return null;

  const topCardId = meta.cardOrder.at(-1)!;
  const remaining = meta.cardOrder.slice(0, -1);

  const topCardShape = editor.getShape(topCardId as TLShapeId) as
    | { props: { imageUrl: string; cardName: string } }
    | undefined;
  if (!topCardShape) return null;

  const { imageUrl, cardName } = topCardShape.props;

  const anchorBounds =
    remaining.length > 0
      ? editor.getShapePageBounds(remaining[0] as TLShapeId)
      : editor.getShapePageBounds(topCardId as TLShapeId);
  const anchorX = anchorBounds?.x ?? 0;
  const anchorY = anchorBounds?.y ?? 0;

  const isGraveyard = stackStore.getGraveyardGroupId() === groupId;

  stackStore.removeStack(groupId);
  editor.ungroupShapes([groupId as TLShapeId]);

  if (remaining.length > 0) {
    applyGraveyardStack(editor, remaining, anchorX, anchorY, isGraveyard);
  }

  editor.deleteShapes([topCardId as TLShapeId]);

  return { id: crypto.randomUUID(), imageUrl, cardName };
}

/** Dissolve the current deck group. */
export function undoDeck(editor: Editor): void {
  const deckGroupId = stackStore.getDeckGroupId();
  if (!deckGroupId) return;
  stackStore.removeStack(deckGroupId);
  editor.ungroupShapes([deckGroupId as TLShapeId]);
}
