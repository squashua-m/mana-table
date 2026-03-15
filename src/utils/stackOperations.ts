import { createShapeId, type Editor, type TLShapeId } from "tldraw";
import * as stackStore from "../stores/stackStore";

// Y offset between cards in a graveyard pile (tight stack)
const GRAVEYARD_OFFSET = -4;
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

  applyGraveyardStack(editor, cardOrder, anchorX, anchorY, true);
}

/** Dissolve the current graveyard group. */
export function undoGraveyard(editor: Editor): void {
  const graveyardGroupId = stackStore.getGraveyardGroupId();
  if (!graveyardGroupId) return;
  stackStore.removeStack(graveyardGroupId);
  editor.ungroupShapes([graveyardGroupId as TLShapeId]);
}
