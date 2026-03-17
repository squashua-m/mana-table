import { useEffect, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createShapeId, type Editor } from "tldraw";
import { CARD_WIDTH, CARD_HEIGHT } from "../shapes";
import { getHandCards, removeFromHand, reorderCard, subscribeHand, type HandCard } from "../stores/handStore";
import { isCanvasDragging, subscribeCanvasDrag } from "../stores/dragStore";

const HAND_DROP_THRESHOLD = 0.80;

type Props = {
  editor: Editor | null;
};

const PLAY_THRESHOLD_RATIO = 0.70;
const REVEAL_ENTER_RATIO = 0.85;
const REVEAL_EXIT_RATIO = 0.75;
const FAN_SPACING = CARD_WIDTH * 0.6;
const SPRING = { type: "spring" as const, stiffness: 200, damping: 22 };
const DIRECTION_LOCK_PX = 10;
const REORDER_AXIS_RATIO = 1.5;

function computeFanLayout(total: number, index: number) {
  const rotation = total === 1 ? 0 : -5 + (index * 10) / (total - 1);
  const totalWidth = (total - 1) * FAN_SPACING;
  const startX = (window.innerWidth - totalWidth) / 2;
  const x = startX + index * FAN_SPACING;
  return { rotation, x };
}

function computeInsertionIndex(cursorX: number, total: number): number {
  for (let i = 0; i < total; i++) {
    const { x } = computeFanLayout(total, i);
    if (cursorX < x + CARD_WIDTH / 2) return i;
  }
  return total - 1;
}

// How far (px) a non-dragged card should shift to make a gap for the dragged card
function computePreviewXOffset(
  cardIndex: number,
  fromIndex: number,
  insertionIndex: number,
  total: number
): number {
  // Position of this card in the "without dragged card" list
  const effectiveIdx = cardIndex < fromIndex ? cardIndex : cardIndex - 1;
  // Shift right if the gap opens at or before this card
  const previewIdx = effectiveIdx >= insertionIndex ? effectiveIdx + 1 : effectiveIdx;
  const previewX = computeFanLayout(total, previewIdx).x;
  const currentX = computeFanLayout(total, cardIndex).x;
  return previewX - currentX;
}

// ─── Reorder drag state shared across all HandCardItems ────────────────────────

type ReorderDragState = {
  cardId: string;
  fromIndex: number;
  insertionIndex: number;
  cursorX: number;
} | null;

// ─── HandCardItem ─────────────────────────────────────────────────────────────

type HandCardItemProps = {
  card: HandCard;
  index: number;
  total: number;
  isRevealed: boolean;
  editor: Editor | null;
  onRemove: (id: string) => void;
  reorderDrag: ReorderDragState;
  onReorderStart: (cardId: string, fromIndex: number, cursorX: number) => void;
  onReorderMove: (insertionIndex: number, cursorX: number) => void;
  onReorderEnd: (fromIndex: number, toIndex: number) => void;
};

function HandCardItem({
  card, index, total, isRevealed, editor, onRemove,
  reorderDrag, onReorderStart, onReorderMove, onReorderEnd,
}: HandCardItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const blockHoverRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragMode = useRef<"undecided" | "reorder" | "play">("undecided");

  const layout = computeFanLayout(total, index);
  const isBeingDragged = reorderDrag?.cardId === card.id;

  // Compute how much this card should shift during another card's reorder drag
  let previewXOffset = 0;
  if (reorderDrag && !isBeingDragged) {
    previewXOffset = computePreviewXOffset(
      index, reorderDrag.fromIndex, reorderDrag.insertionIndex, total
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    blockHoverRef.current = true;
    setIsHovered(false);
    isDraggingRef.current = true;
    dragMode.current = "undecided";
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    if (dragMode.current === "undecided") {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (total <= 1) {
        dragMode.current = "play";
      } else if (absDx > DIRECTION_LOCK_PX && absDx > absDy * REORDER_AXIS_RATIO) {
        dragMode.current = "reorder";
        onReorderStart(card.id, index, e.clientX);
      } else if (absDy > DIRECTION_LOCK_PX) {
        dragMode.current = "play";
      }
      return;
    }

    if (dragMode.current === "reorder") {
      const targetIdx = computeInsertionIndex(e.clientX, total);
      onReorderMove(targetIdx, e.clientX);
      return;
    }

    // play mode: float card ghost with cursor
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    if (dragMode.current === "reorder") {
      const targetIdx = computeInsertionIndex(e.clientX, total);
      onReorderEnd(index, targetIdx);
      dragMode.current = "undecided";
      isDraggingRef.current = false;
      setIsDragging(false);
      requestAnimationFrame(() => { blockHoverRef.current = false; });
      e.stopPropagation();
      return;
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    const threshold = window.innerHeight * PLAY_THRESHOLD_RATIO;
    if (dragMode.current === "play" && e.clientY < threshold && editor) {
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
      editor.batch(() => {
        editor.createShape({
          id: createShapeId(),
          type: "mtg-card",
          x: pagePoint.x - CARD_WIDTH / 2,
          y: pagePoint.y - CARD_HEIGHT / 2,
          props: {
            imageUrl: card.imageUrl,
            cardName: card.cardName,
            isFlipped: false,
            isTapped: false,
            w: CARD_WIDTH,
            h: CARD_HEIGHT,
          },
        });
        editor.selectNone();
      });
      onRemove(card.id);
    }

    dragMode.current = "undecided";
    requestAnimationFrame(() => { blockHoverRef.current = false; });
    e.stopPropagation();
  };

  // During active play drag: follow the cursor as a fixed overlay
  if (isDragging && dragMode.current === "play") {
    return (
      <div
        style={{
          position: "fixed",
          left: dragPos.x - CARD_WIDTH / 2,
          top: dragPos.y - CARD_HEIGHT / 2,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: "var(--canopy-ds-radius-md)",
          overflow: "hidden",
          border: "1px solid var(--canopy-ds-color-border-border-card)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)",
          zIndex: 700,
          cursor: "grabbing",
          pointerEvents: "all",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={card.imageUrl || ""}
          alt={card.cardName}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Floating ghost that follows cursor X during reorder drag */}
      {isBeingDragged && reorderDrag && (
        <div
          style={{
            position: "fixed",
            left: reorderDrag.cursorX - CARD_WIDTH / 2,
            bottom: 8,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: "var(--canopy-ds-radius-md)",
            overflow: "hidden",
            border: "2px solid var(--canopy-ds-color-action-action-primary)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 700,
            pointerEvents: "none",
            touchAction: "none",
            userSelect: "none",
            transform: "scale(1.08)",
            transformOrigin: "bottom center",
          }}
        >
          <img
            src={card.imageUrl || ""}
            alt={card.cardName}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* Resting card — fades when being dragged, shifts when another card is dragged */}
      <motion.div
        animate={{
          x: previewXOffset,
          y: isRevealed ? 0 : CARD_HEIGHT * 0.8,
          rotate: isHovered && !isBeingDragged ? 0 : layout.rotation,
          scale: isHovered && !isBeingDragged ? 1.2 : isBeingDragged ? 0.95 : 1,
          opacity: isBeingDragged ? 0.3 : 1,
        }}
        transition={SPRING}
        style={{
          position: "fixed",
          bottom: 0,
          left: layout.x,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transformOrigin: "bottom center",
          zIndex: isHovered ? total + 1 : index,
          pointerEvents: "all",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerEnter={() => { if (!blockHoverRef.current) setIsHovered(true); }}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "var(--canopy-ds-radius-md)",
            overflow: "hidden",
            border: "1px solid var(--canopy-ds-color-border-border-card)",
            userSelect: "none",
            boxShadow: isHovered && !isBeingDragged
              ? "0 24px 48px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.2)"
              : "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.cardName}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--canopy-ds-color-surface-surface-level-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--canopy-ds-color-text-icon-text-subtle)",
                fontSize: 12,
                fontFamily: "sans-serif",
                padding: "var(--canopy-ds-spacing-xs)",
                textAlign: "center",
              }}
            >
              {card.cardName}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── ArcHand ──────────────────────────────────────────────────────────────────

export function ArcHand({ editor }: Props) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(isCanvasDragging);
  const [isInDropZone, setIsInDropZone] = useState(false);
  const [reorderDrag, setReorderDrag] = useState<ReorderDragState>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(isCanvasDragging());

  // Subscribe to hand store changes
  useEffect(() => subscribeHand(forceUpdate), []);

  // Subscribe to canvas drag state
  useEffect(() => {
    return subscribeCanvasDrag((v) => {
      isDraggingRef.current = v;
      setIsDraggingCanvas(v);
      if (v) {
        if (hideTimerRef.current !== null) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setIsRevealed(true);
      } else {
        setIsInDropZone(false);
      }
    });
  }, []);

  // Track drop zone activation during canvas drag
  useEffect(() => {
    if (!isDraggingCanvas) return;
    const onMove = (e: PointerEvent) => {
      setIsInDropZone(e.clientY > window.innerHeight * HAND_DROP_THRESHOLD);
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, [isDraggingCanvas]);

  // Reveal / hide on pointer proximity to bottom edge
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) return; // drag state already controls reveal
      const ratio = e.clientY / window.innerHeight;

      if (ratio > REVEAL_ENTER_RATIO) {
        if (hideTimerRef.current !== null) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setIsRevealed(true);
      } else if (ratio < REVEAL_EXIT_RATIO) {
        if (hideTimerRef.current === null) {
          hideTimerRef.current = setTimeout(() => {
            setIsRevealed(false);
            hideTimerRef.current = null;
          }, 500);
        }
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const cards = getHandCards();

  if (cards.length === 0 && !isDraggingCanvas) return null;

  return (
    <>
      {isDraggingCanvas && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100vw",
            height: "20vh",
            pointerEvents: "none",
            zIndex: 555,
            borderTop: isInDropZone
              ? "2px solid var(--canopy-ds-color-action-action-primary)"
              : "2px solid transparent",
            background: isInDropZone
              ? "linear-gradient(to top, color-mix(in srgb, var(--canopy-ds-color-action-action-primary) 15%, transparent), transparent)"
              : "transparent",
            transition: "border-color var(--canopy-ds-motion-fast) ease, background var(--canopy-ds-motion-fast) ease",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "var(--canopy-ds-spacing-lg)",
          }}
        >
          {isInDropZone && (
            <span
              style={{
                color: "var(--canopy-ds-color-text-icon-text-default)",
                fontSize: 12,
                fontFamily: "sans-serif",
                background: "var(--canopy-ds-color-surface-surface-level-2)",
                padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
                borderRadius: "var(--canopy-ds-radius-round)",
                border: "1px solid var(--canopy-ds-color-border-border-default)",
              }}
            >
              Add to hand
            </span>
          )}
        </div>
      )}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: CARD_HEIGHT,
          pointerEvents: "none",
          zIndex: 560,
        }}
      >
        {cards.map((card, i) => (
          <HandCardItem
            key={card.id}
            card={card}
            index={i}
            total={cards.length}
            isRevealed={isRevealed}
            editor={editor}
            onRemove={removeFromHand}
            reorderDrag={reorderDrag}
            onReorderStart={(cardId, fromIndex, cursorX) =>
              setReorderDrag({ cardId, fromIndex, insertionIndex: fromIndex, cursorX })
            }
            onReorderMove={(insertionIndex, cursorX) =>
              setReorderDrag(prev => prev ? { ...prev, insertionIndex, cursorX } : null)
            }
            onReorderEnd={(fromIndex, toIndex) => {
              if (fromIndex !== toIndex) reorderCard(fromIndex, toIndex);
              setReorderDrag(null);
            }}
          />
        ))}
      </div>
    </>
  );
}
