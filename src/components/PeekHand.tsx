import { useEffect, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { type Editor, type TLShapeId } from "tldraw";
import { Icon, Text } from "@canopy-ds/react";
import { CARD_WIDTH, CARD_HEIGHT } from "../shapes";
import {
  isPeekActive,
  getPeekCards,
  subscribePeek,
  removeFromPeek,
  reorderPeekCard,
  type PeekCard,
} from "../stores/peekStore";
import { addToHand } from "../stores/handStore";
import {
  createCardShapeFromPeek,
  addCardToDeck,
  addCardToGraveyard,
  createGraveyard,
} from "../utils/stackOperations";
import { getDeckGroupId, hasDeck, hasGraveyard } from "../stores/stackStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAY_THRESHOLD_RATIO = 0.70;
const FAN_SPACING = CARD_WIDTH * 0.6;
const SPRING = { type: "spring" as const, stiffness: 200, damping: 22 };
const DIRECTION_LOCK_PX = 10;
const REORDER_AXIS_RATIO = 1.5;

type DropZoneId = "top" | "bottom" | "hand" | "graveyard";

const DROP_ZONES: { id: DropZoneId; label: string; icon: string }[] = [
  { id: "top",       label: "Top of Deck",    icon: "arrow-up"   },
  { id: "bottom",    label: "Bottom of Deck", icon: "arrow-down" },
  { id: "hand",      label: "To Hand",        icon: "user"       },
  { id: "graveyard", label: "Graveyard",      icon: "meh"        },
];

// ─── Fan layout helpers (mirrors ArcHand) ─────────────────────────────────────

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

function computePreviewXOffset(
  cardIndex: number,
  fromIndex: number,
  insertionIndex: number,
  total: number
): number {
  const effectiveIdx = cardIndex < fromIndex ? cardIndex : cardIndex - 1;
  const previewIdx = effectiveIdx >= insertionIndex ? effectiveIdx + 1 : effectiveIdx;
  const previewX = computeFanLayout(total, previewIdx).x;
  const currentX = computeFanLayout(total, cardIndex).x;
  return previewX - currentX;
}

// ─── ReorderDragState ─────────────────────────────────────────────────────────

type ReorderDragState = {
  cardId: string;
  fromIndex: number;
  insertionIndex: number;
  cursorX: number;
} | null;

// ─── Zone detection ───────────────────────────────────────────────────────────

function detectActiveZone(
  cursorX: number,
  cursorY: number,
  zoneRefs: React.RefObject<Record<DropZoneId, HTMLDivElement | null>>
): DropZoneId | null {
  for (const id of ["top", "bottom", "hand", "graveyard"] as DropZoneId[]) {
    const el = zoneRefs.current?.[id];
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (cursorX >= rect.left && cursorX <= rect.right &&
        cursorY >= rect.top  && cursorY <= rect.bottom) {
      return id;
    }
  }
  return null;
}

// ─── PeekDropZones ────────────────────────────────────────────────────────────

function PeekDropZones({
  isVisible,
  activeZone,
  zoneRefs,
}: {
  isVisible: boolean;
  activeZone: DropZoneId | null;
  zoneRefs: React.RefObject<Record<DropZoneId, HTMLDivElement | null>>;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 575,
        display: "flex",
        gap: "var(--canopy-ds-spacing-sm)",
        pointerEvents: "none",
        opacity: isVisible ? 1 : 0,
        transition: "opacity var(--canopy-ds-motion-fast) ease",
      }}
    >
      {DROP_ZONES.map(({ id, label, icon }) => {
        const isActive = activeZone === id;
        return (
          <div
            key={id}
            ref={(el) => {
              if (zoneRefs.current) zoneRefs.current[id] = el;
            }}
            style={{
              width: 160,
              height: 80,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--canopy-ds-spacing-2xs)",
              borderRadius: "var(--canopy-ds-radius-md)",
              border: isActive
                ? "2px solid var(--canopy-ds-color-action-action-primary)"
                : "1px solid var(--canopy-ds-color-border-border-default)",
              background: isActive
                ? "color-mix(in srgb, var(--canopy-ds-color-action-action-primary) 15%, var(--canopy-ds-color-surface-surface-level-2))"
                : "var(--canopy-ds-color-surface-surface-level-2)",
              backdropFilter: "blur(var(--canopy-ds-blur-md))",
              transition: "border-color var(--canopy-ds-motion-fast) ease, background var(--canopy-ds-motion-fast) ease",
            }}
          >
            <Icon name={icon} size="md" />
            <Text variant="caption-01" as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}>
              {label}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

// ─── PeekBadge ────────────────────────────────────────────────────────────────

function PeekBadge({ editor, count }: { editor: Editor; count: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const deckId = getDeckGroupId();
      if (!deckId) { setPos(null); return; }
      const bounds = editor.getShapePageBounds(deckId as TLShapeId);
      if (!bounds) { setPos(null); return; }
      setPos(editor.pageToScreen({ x: bounds.midX, y: bounds.minY }));
    };
    update();
    const cleanup = editor.store.listen(update);
    return cleanup;
  }, [editor]);

  if (!pos || count === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y - 8,
        transform: "translate(-50%, -100%)",
        zIndex: 580,
        display: "flex",
        alignItems: "center",
        gap: "var(--canopy-ds-spacing-2xs)",
        background: "var(--canopy-ds-color-surface-surface-level-2)",
        border: "1px solid var(--canopy-ds-color-border-border-default)",
        borderRadius: "var(--canopy-ds-radius-round)",
        padding: "var(--canopy-ds-spacing-2xs) var(--canopy-ds-spacing-xs)",
        backdropFilter: "blur(var(--canopy-ds-blur-sm))",
        pointerEvents: "none",
      }}
    >
      <Icon name="eye" size="sm" />
      <Text variant="caption-01" as="span">{count}</Text>
    </div>
  );
}

// ─── PeekCardItem ─────────────────────────────────────────────────────────────

type PeekCardItemProps = {
  card: PeekCard;
  index: number;
  total: number;
  editor: Editor | null;
  onPlace: (card: PeekCard, zone: DropZoneId) => void;
  reorderDrag: ReorderDragState;
  onReorderStart: (cardId: string, fromIndex: number, cursorX: number) => void;
  onReorderMove: (insertionIndex: number, cursorX: number) => void;
  onReorderEnd: (fromIndex: number, toIndex: number) => void;
  activeZone: DropZoneId | null;
  onZoneChange: (zone: DropZoneId | null) => void;
  onShowZones: (show: boolean) => void;
  zoneRefs: React.RefObject<Record<DropZoneId, HTMLDivElement | null>>;
};

function PeekCardItem({
  card, index, total, editor, onPlace,
  reorderDrag, onReorderStart, onReorderMove, onReorderEnd,
  onZoneChange, onShowZones, zoneRefs,
}: PeekCardItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const blockHoverRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragMode = useRef<"undecided" | "reorder" | "play">("undecided");

  const layout = computeFanLayout(total, index);
  const isBeingDragged = reorderDrag?.cardId === card.id;

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

    // play mode
    setDragPos({ x: e.clientX, y: e.clientY });

    const aboveThreshold = e.clientY < window.innerHeight * PLAY_THRESHOLD_RATIO;
    if (aboveThreshold) {
      onShowZones(true);
      onZoneChange(detectActiveZone(e.clientX, e.clientY, zoneRefs));
    } else {
      onShowZones(false);
      onZoneChange(null);
    }
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
    onShowZones(false);

    const aboveThreshold = e.clientY < window.innerHeight * PLAY_THRESHOLD_RATIO;
    if (dragMode.current === "play" && aboveThreshold && editor) {
      const zone = detectActiveZone(e.clientX, e.clientY, zoneRefs);
      onPlace(card, zone ?? "hand");
    }

    onZoneChange(null);
    dragMode.current = "undecided";
    requestAnimationFrame(() => { blockHoverRef.current = false; });
    e.stopPropagation();
  };

  // Floating ghost during play drag
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
      {/* Ghost during reorder drag */}
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

      {/* Resting card — always fully visible (peek hand is always revealed) */}
      <motion.div
        animate={{
          x: previewXOffset,
          y: 0,
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

// ─── PeekHand ─────────────────────────────────────────────────────────────────

type Props = {
  editor: Editor | null;
};

export function PeekHand({ editor }: Props) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [reorderDrag, setReorderDrag] = useState<ReorderDragState>(null);
  const [activeZone, setActiveZone] = useState<DropZoneId | null>(null);
  const [showZones, setShowZones] = useState(false);
  const zoneRefs = useRef<Record<DropZoneId, HTMLDivElement | null>>({
    top: null,
    bottom: null,
    hand: null,
    graveyard: null,
  });

  useEffect(() => subscribePeek(forceUpdate), []);

  if (!isPeekActive() || !editor) return null;

  const cards = getPeekCards();

  function handlePlace(card: PeekCard, zone: DropZoneId) {
    if (!editor) return;

    switch (zone) {
      case "hand": {
        addToHand({ id: crypto.randomUUID(), imageUrl: card.imageUrl, cardName: card.cardName });
        break;
      }
      case "top":
      case "bottom": {
        if (!hasDeck()) break;
        const deckId = getDeckGroupId()!;
        const deckBounds = editor.getShapePageBounds(deckId as TLShapeId);
        const x = deckBounds?.x ?? 0;
        const y = deckBounds?.y ?? 0;
        const newId = createCardShapeFromPeek(editor, card, x, y);
        addCardToDeck(editor, newId, zone === "top" ? "top" : "bottom");
        break;
      }
      case "graveyard": {
        const deckId = getDeckGroupId();
        const deckBounds = deckId ? editor.getShapePageBounds(deckId as TLShapeId) : null;
        const x = (deckBounds?.x ?? 200) + CARD_WIDTH + 16;
        const y = deckBounds?.y ?? 200;
        const newId = createCardShapeFromPeek(editor, card, x, y);
        if (hasGraveyard()) {
          addCardToGraveyard(editor, newId);
        } else {
          createGraveyard(editor, [newId]);
        }
        break;
      }
    }

    removeFromPeek(card.id);
  }

  return (
    <>
      <PeekBadge editor={editor} count={cards.length} />
      <PeekDropZones
        isVisible={showZones}
        activeZone={activeZone}
        zoneRefs={zoneRefs}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: CARD_HEIGHT,
          pointerEvents: "none",
          zIndex: 565,
        }}
      >
        {cards.map((card, i) => (
          <PeekCardItem
            key={card.id}
            card={card}
            index={i}
            total={cards.length}
            editor={editor}
            onPlace={handlePlace}
            reorderDrag={reorderDrag}
            onReorderStart={(cardId, fromIndex, cursorX) =>
              setReorderDrag({ cardId, fromIndex, insertionIndex: fromIndex, cursorX })
            }
            onReorderMove={(insertionIndex, cursorX) =>
              setReorderDrag(prev => prev ? { ...prev, insertionIndex, cursorX } : null)
            }
            onReorderEnd={(fromIndex, toIndex) => {
              if (fromIndex !== toIndex) reorderPeekCard(fromIndex, toIndex);
              setReorderDrag(null);
            }}
            activeZone={activeZone}
            onZoneChange={setActiveZone}
            onShowZones={setShowZones}
            zoneRefs={zoneRefs}
          />
        ))}
      </div>
    </>
  );
}
