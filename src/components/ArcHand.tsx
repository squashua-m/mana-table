import { useEffect, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createShapeId, type Editor } from "tldraw";
import { CARD_WIDTH, CARD_HEIGHT } from "../shapes";
import { getHandCards, removeFromHand, subscribeHand, type HandCard } from "../stores/handStore";
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

function computeFanLayout(total: number, index: number) {
  const rotation = total === 1 ? 0 : -5 + (index * 10) / (total - 1);
  const totalWidth = (total - 1) * FAN_SPACING;
  const startX = (window.innerWidth - totalWidth) / 2;
  const x = startX + index * FAN_SPACING;
  return { rotation, x };
}

// ─── HandCardItem ─────────────────────────────────────────────────────────────

type HandCardItemProps = {
  card: HandCard;
  index: number;
  total: number;
  isRevealed: boolean;
  editor: Editor | null;
  onRemove: (id: string) => void;
};

function HandCardItem({ card, index, total, isRevealed, editor, onRemove }: HandCardItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const layout = computeFanLayout(total, index);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const threshold = window.innerHeight * PLAY_THRESHOLD_RATIO;
    if (e.clientY < threshold && editor) {
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
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
      onRemove(card.id);
    }

    e.stopPropagation();
  };

  // During active drag: follow the cursor as a fixed overlay
  if (isDragging) {
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
    <motion.div
      animate={{
        y: isRevealed ? 0 : CARD_HEIGHT * 0.8,
        rotate: isHovered ? 0 : layout.rotation,
        scale: isHovered ? 1.2 : 1,
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
        cursor: "grab",
        touchAction: "none",
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
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
          boxShadow: isHovered
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
  );
}

// ─── ArcHand ──────────────────────────────────────────────────────────────────

export function ArcHand({ editor }: Props) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(isCanvasDragging);
  const [isInDropZone, setIsInDropZone] = useState(false);
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
          />
        ))}
      </div>
    </>
  );
}
