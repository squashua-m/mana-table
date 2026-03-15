import { useEffect, useRef, useState } from "react";
import { GlassButton, Icon, Text } from "@canopy-ds/react";
import type { Editor, TLShapeId } from "tldraw";
import type { MtgCardShape } from "../shapes";
import { hasGraveyard, getGraveyardGroupId, getStack } from "../stores/stackStore";
import {
  findNearestOverlappingCard,
  findAllOverlappingCards,
  stackOnTop,
  tuckUnderneath,
  createGraveyard,
  addCardToGraveyard,
  undoGraveyard,
} from "../utils/stackOperations";

type Props = {
  editor: Editor | null;
};

type Position = { x: number; y: number };

type ActionTarget =
  | { mode: "single"; shape: MtgCardShape; hasOverlap?: boolean; isOverGraveyard?: boolean }
  | { mode: "multi"; shapes: MtgCardShape[] }
  | { mode: "graveyard"; groupId: string }
  | null;

function cardOverlapsGraveyard(editor: Editor, cardId: string, graveyardId: string): boolean {
  const cardBounds = editor.getShapePageBounds(cardId as TLShapeId);
  const graveBounds = editor.getShapePageBounds(graveyardId as TLShapeId);
  if (!cardBounds || !graveBounds) return false;
  return !(
    cardBounds.maxX < graveBounds.minX ||
    cardBounds.minX > graveBounds.maxX ||
    cardBounds.maxY < graveBounds.minY ||
    cardBounds.minY > graveBounds.maxY
  );
}


export function CardActions({ editor }: Props) {
  const [target, setTarget] = useState<ActionTarget>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const isBarHoveredRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = () => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => {
      setTarget(null);
      setPosition(null);
      hideTimerRef.current = null;
    }, 150);
  };

  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen(() => {
      const selected = editor.getSelectedShapes();
      const graveyardId = getGraveyardGroupId();

      if (
        selected.length === 1 &&
        selected[0].type === "group" &&
        selected[0].id === graveyardId
      ) {
        const bounds = editor.getSelectionPageBounds();
        if (bounds) {
          cancelHide();
          setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
          setTarget({ mode: "graveyard", groupId: selected[0].id });
        }
        return;
      }

      if (selected.length === 1 && selected[0].type === "mtg-card") {
        const card = selected[0] as MtgCardShape;
        const bounds = editor.getSelectionPageBounds();
        if (!bounds) return;

        if (graveyardId && cardOverlapsGraveyard(editor, card.id, graveyardId)) {
          cancelHide();
          setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
          setTarget({ mode: "single", shape: card, isOverGraveyard: true });
        } else {
          const overlappingIds = findAllOverlappingCards(editor, card.id);
          if (overlappingIds.length > 0) {
            const allIds = [card.id, ...overlappingIds];
            const allBounds = allIds
              .map((id) => editor.getShapePageBounds(id as TLShapeId))
              .filter(Boolean);
            const maxY = Math.max(...allBounds.map((b) => b!.maxY));
            const midX = allBounds.reduce((sum, b) => sum + b!.midX, 0) / allBounds.length;
            cancelHide();
            setPosition(editor.pageToScreen({ x: midX, y: maxY }));
            setTarget({ mode: "single", shape: card, hasOverlap: true });
          } else {
            cancelHide();
            setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
            setTarget({ mode: "single", shape: card });
          }
        }
        return;
      }

      if (selected.length >= 2 && selected.every((s) => s.type === "mtg-card")) {
        const cards = selected as MtgCardShape[];
        const bounds = editor.getSelectionPageBounds();
        if (bounds) {
          cancelHide();
          setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
          setTarget({ mode: "multi", shapes: cards });
        }
        return;
      }

      const hoveredId = editor.getHoveredShapeId();
      if (hoveredId) {
        const hoveredShape = editor.getShape(hoveredId);

        if (hoveredShape?.type === "mtg-card") {
          const bounds = editor.getShapePageBounds(hoveredId);
          if (!bounds) return;

          if (graveyardId && cardOverlapsGraveyard(editor, hoveredId, graveyardId)) {
            cancelHide();
            setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
            setTarget({ mode: "single", shape: hoveredShape as MtgCardShape, isOverGraveyard: true });
            return;
          }

          const overlappingIds = findAllOverlappingCards(editor, hoveredId);
          if (overlappingIds.length > 0) {
            const allIds = [hoveredId, ...overlappingIds];
            const allBounds = allIds
              .map((id) => editor.getShapePageBounds(id as TLShapeId))
              .filter(Boolean);
            const maxY = Math.max(...allBounds.map((b) => b!.maxY));
            const midX = allBounds.reduce((sum, b) => sum + b!.midX, 0) / allBounds.length;
            cancelHide();
            setPosition(editor.pageToScreen({ x: midX, y: maxY }));
            setTarget({ mode: "single", shape: hoveredShape as MtgCardShape, hasOverlap: true });
          } else {
            cancelHide();
            setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
            setTarget({ mode: "single", shape: hoveredShape as MtgCardShape });
          }
          return;
        }

        if (hoveredShape?.type === "group") {
          const bounds = editor.getShapePageBounds(hoveredId);
          if (!bounds) return;
          const pos = editor.pageToScreen({ x: bounds.midX, y: bounds.maxY });

          if (hoveredShape.id === graveyardId) {
            cancelHide();
            setPosition(pos);
            setTarget({ mode: "graveyard", groupId: hoveredShape.id });
            return;
          }

          const meta = getStack(hoveredShape.id);
          if (meta) {
            const topCardId = meta.cardOrder[meta.cardOrder.length - 1];
            const topCard = editor.getShape(topCardId as TLShapeId) as MtgCardShape | undefined;
            if (topCard) {
              cancelHide();
              setPosition(pos);
              setTarget({ mode: "single", shape: topCard });
              return;
            }
          }
        }
      }

      if (!isBarHoveredRef.current) {
        scheduleHide();
      }
    });

    return () => {
      cleanup();
      cancelHide();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const containerStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        left: position.x,
        top: position.y + 8,
        transform: "translateX(-50%)",
        zIndex: 550,
        pointerEvents: "all",
        display: "flex",
        gap: "var(--canopy-ds-spacing-2xs)",
        alignItems: "center",
      }
    : {};

  const barProps = {
    onMouseEnter: () => { isBarHoveredRef.current = true; cancelHide(); },
    onMouseLeave: () => { isBarHoveredRef.current = false; },
  };

  function renderGraveyardMode() {
    return (
      <GlassButton
        size="sm"
        aria-label="Undo graveyard"
        onClick={() => {
          isBarHoveredRef.current = false;
          undoGraveyard(editor!);
          setTarget(null);
          setPosition(null);
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--canopy-ds-spacing-2xs)", color: "var(--canopy-ds-color-text-icon-text-critical)" }}>
          <Icon name="rotate-ccw" size="sm" />
          <Text variant="headline-02" as="span">Undo Graveyard</Text>
        </span>
      </GlassButton>
    );
  }

  function renderMultiMode() {
    const { shapes } = target as Extract<ActionTarget, { mode: "multi" }>;
    const sortedIds = [...shapes].sort((a, b) => a.y - b.y).map((s) => s.id);
    const graveyard = hasGraveyard();

    const handleOrganize = () => {
      const sorted = [...shapes].sort((a, b) => a.y - b.y);
      const anchorX = sorted[0].x;
      const anchorY = sorted[0].y;
      editor!.updateShapes(
        sorted.map((card, i) => ({
          id: card.id as TLShapeId,
          type: "mtg-card" as const,
          x: anchorX,
          y: anchorY + i * 40,
        }))
      );
    };

    const handleMultiSendToGraveyard = () => {
      for (const shape of shapes) {
        addCardToGraveyard(editor!, shape.id);
      }
    };

    return (
      <>
        {!graveyard && (
          <GlassButton
            size="sm"
            aria-label="Create graveyard"
            onClick={() => {
              isBarHoveredRef.current = false;
              createGraveyard(editor!, sortedIds);
              setTarget(null);
              setPosition(null);
            }}
          >
            <Text variant="headline-02" as="span">Create Graveyard</Text>
          </GlassButton>
        )}
        {graveyard && (
          <GlassButton
            size="sm"
            iconOnly
            aria-label="Send to graveyard"
            onClick={handleMultiSendToGraveyard}
          >
            <Icon name="meh" size="sm" />
          </GlassButton>
        )}
        <GlassButton size="sm" iconOnly aria-label="Organize cards" onClick={handleOrganize}>
          <Icon name="layers" size="sm" />
        </GlassButton>
      </>
    );
  }

  function renderSingleMode() {
    const { shape, hasOverlap, isOverGraveyard } = target as Extract<ActionTarget, { mode: "single" }>;
    const nearestCard = findNearestOverlappingCard(editor!, shape.id);
    const graveyard = hasGraveyard();

    if (isOverGraveyard) {
      return (
        <GlassButton
          size="sm"
          iconOnly
          aria-label="Add to graveyard"
          onClick={() => addCardToGraveyard(editor!, shape.id)}
        >
          <Icon name="meh" size="sm" />
        </GlassButton>
      );
    }

    const handleFlip = () => {
      editor!.updateShape<MtgCardShape>({
        id: shape.id,
        type: "mtg-card",
        props: { isFlipped: !shape.props.isFlipped },
      });
    };

    const handleTapToggle = () => {
      editor!.updateShape<MtgCardShape>({
        id: shape.id,
        type: "mtg-card",
        props: { isTapped: !shape.props.isTapped },
      });
    };

    return (
      <>
        {hasOverlap && !graveyard && nearestCard && (
          <GlassButton
            size="sm"
            aria-label="Create graveyard"
            onClick={() => {
              isBarHoveredRef.current = false;
              createGraveyard(editor!, [shape.id, nearestCard]);
              setTarget(null);
              setPosition(null);
            }}
          >
            <Text variant="headline-02" as="span">Create Graveyard</Text>
          </GlassButton>
        )}
        {graveyard && (
          <GlassButton
            size="sm"
            iconOnly
            aria-label="Send to graveyard"
            onClick={() => addCardToGraveyard(editor!, shape.id)}
          >
            <Icon name="meh" size="sm" />
          </GlassButton>
        )}
        {nearestCard && (
          <GlassButton
            size="sm"
            aria-label="Stack on top"
            onClick={() => stackOnTop(editor!, shape.id, nearestCard)}
          >
            <Icon name="layers" size="sm" />
            <Icon name="arrow-up" size="sm" />
          </GlassButton>
        )}
        {nearestCard && (
          <GlassButton
            size="sm"
            aria-label="Tuck underneath"
            onClick={() => tuckUnderneath(editor!, shape.id, nearestCard)}
          >
            <Icon name="layers" size="sm" />
            <Icon name="arrow-down" size="sm" />
          </GlassButton>
        )}
        <GlassButton
          size="sm"
          iconOnly
          aria-label={shape.props.isFlipped ? "Unflip card" : "Flip card"}
          onClick={handleFlip}
        >
          <Icon name="repeat" size="sm" />
        </GlassButton>
        <GlassButton
          size="sm"
          iconOnly
          aria-label={shape.props.isTapped ? "Untap card" : "Tap card"}
          onClick={handleTapToggle}
        >
          <Icon name="corner-up-right" size="sm" />
        </GlassButton>
      </>
    );
  }

  if (!target || !position || !editor) return null;

  return (
    <div style={containerStyle} {...barProps}>
      {target.mode === "graveyard" && renderGraveyardMode()}
      {target.mode === "multi" && renderMultiMode()}
      {target.mode === "single" && renderSingleMode()}
    </div>
  );
}
