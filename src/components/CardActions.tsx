import { useEffect, useRef, useState } from "react";
import { GlassButton, Icon, Text } from "@canopy-ds/react";
import type { Editor, TLShapeId } from "tldraw";
import type { MtgCardShape } from "../shapes";
import { hasGraveyard, getGraveyardGroupId, getStack, getDeckGroupId } from "../stores/stackStore";
import {
  findNearestOverlappingCard,
  findAllOverlappingCards,
  stackOnTop,
  tuckUnderneath,
  createGraveyard,
  addCardToGraveyard,
  undoGraveyard,
  addCardToDeck,
  drawFromDeck,
  drawManyFromDeck,
  millFromDeck,
  shuffleDeck,
} from "../utils/stackOperations";
import { addToHand, addManyToHand } from "../stores/handStore";

type Props = {
  editor: Editor | null;
};

type Position = { x: number; y: number };

type ActionTarget =
  | { mode: "single"; shape: MtgCardShape; hasOverlap?: boolean; isOverGraveyard?: boolean }
  | { mode: "multi"; shapes: MtgCardShape[] }
  | { mode: "graveyard"; groupId: string }
  | { mode: "deck"; groupId: string }
  | { mode: "card-to-deck"; card: MtgCardShape; deckGroupId: string }
  | null;

function boundsOverlap(
  a: { maxX: number; maxY: number; minX: number; minY: number },
  b: { maxX: number; maxY: number; minX: number; minY: number }
): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

function cardOverlapsGraveyard(editor: Editor, cardId: string, graveyardId: string): boolean {
  const cardBounds = editor.getShapePageBounds(cardId as TLShapeId);
  const graveBounds = editor.getShapePageBounds(graveyardId as TLShapeId);
  if (!cardBounds || !graveBounds) return false;
  return boundsOverlap(cardBounds, graveBounds);
}

function findOverlappingDeckGroup(editor: Editor, cardId: string): string | null {
  const deckGroupId = getDeckGroupId();
  if (!deckGroupId) return null;
  // Skip cards already inside the deck group
  const card = editor.getShape(cardId as TLShapeId);
  if (card?.parentId === deckGroupId) return null;
  const cardBounds = editor.getShapePageBounds(cardId as TLShapeId);
  const deckBounds = editor.getShapePageBounds(deckGroupId as TLShapeId);
  if (!cardBounds || !deckBounds) return null;
  return boundsOverlap(cardBounds, deckBounds) ? deckGroupId : null;
}

export function CardActions({ editor }: Props) {
  const [target, setTarget] = useState<ActionTarget>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [labelPosition, setLabelPosition] = useState<Position | null>(null);

  const isBarHoveredRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<ActionTarget>(null);

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
      setLabelPosition(null);
      hideTimerRef.current = null;
    }, 150);
  };

  useEffect(() => { targetRef.current = target; }, [target]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      const key = e.key.toLowerCase();
      const t = targetRef.current;

      if (t?.mode === "single") {
        const { shape } = t;
        if (key === "f") {
          const fresh = editor.getShape<MtgCardShape>(shape.id);
          if (!fresh) return;
          editor.updateShape<MtgCardShape>({ id: shape.id, type: "mtg-card", props: { isFlipped: !fresh.props.isFlipped } });
        } else if (key === "t") {
          const fresh = editor.getShape<MtgCardShape>(shape.id);
          if (!fresh) return;
          editor.updateShape<MtgCardShape>({ id: shape.id, type: "mtg-card", props: { isTapped: !fresh.props.isTapped } });
        } else if (key === "e") {
          if (hasGraveyard()) addCardToGraveyard(editor, shape.id);
        } else if (key === "]") {
          const nearest = findNearestOverlappingCard(editor, shape.id);
          if (nearest) stackOnTop(editor, shape.id, nearest);
        } else if (key === "[") {
          const nearest = findNearestOverlappingCard(editor, shape.id);
          if (nearest) tuckUnderneath(editor, shape.id, nearest);
        }
      } else if (t?.mode === "multi") {
        if (key === "f") {
          const allFlipped = t.shapes.every(s => editor.getShape<MtgCardShape>(s.id)?.props.isFlipped);
          editor.updateShapes(t.shapes.map(s => ({ id: s.id as TLShapeId, type: "mtg-card" as const, props: { isFlipped: !allFlipped } })));
        } else if (key === "t") {
          const allTapped = t.shapes.every(s => editor.getShape<MtgCardShape>(s.id)?.props.isTapped);
          editor.updateShapes(t.shapes.map(s => ({ id: s.id as TLShapeId, type: "mtg-card" as const, props: { isTapped: !allTapped } })));
        } else if (key === "e" && hasGraveyard()) {
          for (const shape of t.shapes) addCardToGraveyard(editor, shape.id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen(() => {
      const selected = editor.getSelectedShapes();
      const graveyardId = getGraveyardGroupId();
      const deckId = getDeckGroupId();

      // Single card selected
      if (selected.length === 1 && selected[0].type === "mtg-card") {
        const card = selected[0] as MtgCardShape;
        const bounds = editor.getSelectionPageBounds();
        if (!bounds) return;

        // Card overlapping deck group → card-to-deck mode
        const overlappingDeck = findOverlappingDeckGroup(editor, card.id);
        if (overlappingDeck) {
          cancelHide();
          setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
          setTarget({ mode: "card-to-deck", card, deckGroupId: overlappingDeck });
          return;
        }

        if (graveyardId && cardOverlapsGraveyard(editor, card.id, graveyardId)) {
          cancelHide();
          setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
          setTarget({ mode: "single", shape: card, isOverGraveyard: true });
        } else {
          const overlappingIds = findAllOverlappingCards(editor, card.id);
          if (overlappingIds.length > 0) {
            const allIds = [card.id, ...overlappingIds];
            const allBounds = allIds.map((id) => editor.getShapePageBounds(id as TLShapeId)).filter(Boolean);
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

      // Multiple cards selected
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

      // Hovered shape
      const hoveredId = editor.getHoveredShapeId();
      if (hoveredId) {
        const hoveredShape = editor.getShape(hoveredId);

        if (hoveredShape?.type === "mtg-card") {
          const bounds = editor.getShapePageBounds(hoveredId);
          if (!bounds) return;

          // Card is inside the deck group — show deck actions instead
          if (deckId && hoveredShape.parentId === deckId) {
            const deckBounds = editor.getShapePageBounds(deckId as TLShapeId);
            if (deckBounds) {
              cancelHide();
              setPosition(editor.pageToScreen({ x: deckBounds.midX, y: deckBounds.maxY }));
              setLabelPosition(editor.pageToScreen({ x: deckBounds.midX, y: deckBounds.minY }));
              setTarget({ mode: "deck", groupId: deckId });
              return;
            }
          }

          const overlappingDeck = findOverlappingDeckGroup(editor, hoveredId);
          if (overlappingDeck) {
            cancelHide();
            setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
            setTarget({ mode: "card-to-deck", card: hoveredShape as MtgCardShape, deckGroupId: overlappingDeck });
            return;
          }

          if (graveyardId && cardOverlapsGraveyard(editor, hoveredId, graveyardId)) {
            cancelHide();
            setPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.maxY }));
            setTarget({ mode: "single", shape: hoveredShape as MtgCardShape, isOverGraveyard: true });
            return;
          }

          const overlappingIds = findAllOverlappingCards(editor, hoveredId);
          if (overlappingIds.length > 0) {
            const allIds = [hoveredId, ...overlappingIds];
            const allBounds = allIds.map((id) => editor.getShapePageBounds(id as TLShapeId)).filter(Boolean);
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

          // Deck group
          if (hoveredShape.id === deckId) {
            cancelHide();
            setPosition(pos);
            setLabelPosition(editor.pageToScreen({ x: bounds.midX, y: bounds.minY }));
            setTarget({ mode: "deck", groupId: hoveredShape.id });
            return;
          }

          // Graveyard group
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

  function renderDeckMode() {
    const { groupId } = target as Extract<ActionTarget, { mode: "deck" }>;
    const meta = getStack(groupId);
    const count = meta?.cardOrder.length ?? 0;

    const handleMill = () => { millFromDeck(editor!); };
    const handleShuffle = () => { shuffleDeck(editor!); };
    const handleDraw7 = () => {
      const drawn = drawManyFromDeck(editor!, 7);
      if (drawn.length > 0) addManyToHand(drawn);
    };
    const handleDraw1 = () => {
      const drawn = drawFromDeck(editor!);
      if (drawn) addToHand(drawn);
    };

    return (
      <>
        <GlassButton size="sm" iconOnly aria-label="Mill 1 card" onClick={handleMill} disabled={count === 0}>
          <Icon name="frown" size="sm" />
        </GlassButton>
        <GlassButton size="sm" aria-label="Shuffle deck" onClick={handleShuffle} disabled={count === 0}>
          <Text variant="headline-02" as="span">Shuffle</Text>
        </GlassButton>
        <GlassButton size="sm" aria-label="Draw 7 cards" onClick={handleDraw7} disabled={count === 0}>
          <Text variant="headline-02" as="span">draw 7</Text>
        </GlassButton>
        <GlassButton size="sm" aria-label="Draw 1 card" onClick={handleDraw1} disabled={count === 0}>
          <Text variant="headline-02" as="span">draw</Text>
        </GlassButton>
      </>
    );
  }

  function renderCardToDeckMode() {
    const { card, deckGroupId } = target as Extract<ActionTarget, { mode: "card-to-deck" }>;

    const handleTop = () => {
      isBarHoveredRef.current = false;
      addCardToDeck(editor!, card.id, "top");
      setTarget(null);
      setPosition(null);
    };

    const handleBottom = () => {
      isBarHoveredRef.current = false;
      addCardToDeck(editor!, card.id, "bottom");
      setTarget(null);
      setPosition(null);
    };

    // Suppress unused variable warning — deckGroupId confirms the deck exists
    void deckGroupId;

    return (
      <>
        <GlassButton size="sm" aria-label="Place on top of deck" onClick={handleTop}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--canopy-ds-spacing-2xs)" }}>
            <Icon name="arrow-up" size="sm" />
            <Text variant="headline-02" as="span">Top of Deck</Text>
          </span>
        </GlassButton>
        <GlassButton size="sm" aria-label="Place on bottom of deck" onClick={handleBottom}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--canopy-ds-spacing-2xs)" }}>
            <Icon name="arrow-down" size="sm" />
            <Text variant="headline-02" as="span">Bottom of Deck</Text>
          </span>
        </GlassButton>
      </>
    );
  }

  function renderMultiMode() {
    const { shapes } = target as Extract<ActionTarget, { mode: "multi" }>;
    const sortedIds = [...shapes].sort((a, b) => a.y - b.y).map((s) => s.id);
    const graveyard = hasGraveyard();
    const allFlipped = shapes.every(s => s.props.isFlipped);
    const allTapped = shapes.every(s => s.props.isTapped);

    const handleFlipAll = () => {
      editor!.updateShapes(shapes.map(s => ({ id: s.id as TLShapeId, type: "mtg-card" as const, props: { isFlipped: !allFlipped } })));
    };

    const handleTapAll = () => {
      editor!.updateShapes(shapes.map(s => ({ id: s.id as TLShapeId, type: "mtg-card" as const, props: { isTapped: !allTapped } })));
    };

    const handleOrganize = () => {
      const sorted = [...shapes].sort((a, b) => a.y - b.y);
      const anchorX = sorted[0].x;
      const anchorY = sorted[0].y;
      editor!.updateShapes(sorted.map((card, i) => ({ id: card.id as TLShapeId, type: "mtg-card" as const, x: anchorX, y: anchorY + i * 40 })));
      for (const card of sorted) editor!.bringToFront([card.id as TLShapeId]);
    };

    return (
      <>
        {!graveyard && (
          <GlassButton size="sm" aria-label="Create graveyard" onClick={() => {
            isBarHoveredRef.current = false;
            createGraveyard(editor!, sortedIds);
            setTarget(null);
            setPosition(null);
          }}>
            <Text variant="headline-02" as="span">Create Graveyard</Text>
          </GlassButton>
        )}
        {graveyard && (
          <GlassButton size="sm" iconOnly aria-label="Send to graveyard" onClick={() => {
            for (const shape of shapes) addCardToGraveyard(editor!, shape.id);
          }}>
            <Icon name="meh" size="sm" />
          </GlassButton>
        )}
        <GlassButton size="sm" iconOnly aria-label={allFlipped ? "Unflip all" : "Flip all"} onClick={handleFlipAll}>
          <Icon name="repeat" size="sm" />
        </GlassButton>
        <GlassButton size="sm" iconOnly aria-label={allTapped ? "Untap all" : "Tap all"} onClick={handleTapAll}>
          <Icon name="corner-up-right" size="sm" />
        </GlassButton>
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
        <GlassButton size="sm" iconOnly aria-label="Add to graveyard" onClick={() => addCardToGraveyard(editor!, shape.id)}>
          <Icon name="meh" size="sm" />
        </GlassButton>
      );
    }

    const handleFlip = () => {
      const fresh = editor!.getShape<MtgCardShape>(shape.id);
      if (!fresh) return;
      editor!.updateShape<MtgCardShape>({ id: shape.id, type: "mtg-card", props: { isFlipped: !fresh.props.isFlipped } });
    };

    const handleTapToggle = () => {
      const fresh = editor!.getShape<MtgCardShape>(shape.id);
      if (!fresh) return;
      editor!.updateShape<MtgCardShape>({ id: shape.id, type: "mtg-card", props: { isTapped: !fresh.props.isTapped } });
    };

    return (
      <>
        {hasOverlap && !graveyard && nearestCard && (
          <GlassButton size="sm" aria-label="Create graveyard" onClick={() => {
            isBarHoveredRef.current = false;
            createGraveyard(editor!, [shape.id, nearestCard]);
            setTarget(null);
            setPosition(null);
          }}>
            <Text variant="headline-02" as="span">Create Graveyard</Text>
          </GlassButton>
        )}
        {graveyard && (
          <GlassButton size="sm" iconOnly aria-label="Send to graveyard" onClick={() => addCardToGraveyard(editor!, shape.id)}>
            <Icon name="meh" size="sm" />
          </GlassButton>
        )}
        {nearestCard && (
          <GlassButton size="sm" aria-label="Stack on top" onClick={() => stackOnTop(editor!, shape.id, nearestCard)}>
            <Icon name="layers" size="sm" />
            <Icon name="arrow-up" size="sm" />
          </GlassButton>
        )}
        {nearestCard && (
          <GlassButton size="sm" aria-label="Tuck underneath" onClick={() => tuckUnderneath(editor!, shape.id, nearestCard)}>
            <Icon name="layers" size="sm" />
            <Icon name="arrow-down" size="sm" />
          </GlassButton>
        )}
        <GlassButton size="sm" iconOnly aria-label={shape.props.isFlipped ? "Unflip" : "Flip"} onClick={handleFlip}>
          <Icon name="repeat" size="sm" />
        </GlassButton>
        <GlassButton size="sm" iconOnly aria-label={shape.props.isTapped ? "Untap" : "Tap"} onClick={handleTapToggle}>
          <Icon name="corner-up-right" size="sm" />
        </GlassButton>
      </>
    );
  }

  if (!target || !position || !editor) return null;

  const deckLabelMeta = target.mode === "deck" && labelPosition
    ? getStack((target as Extract<ActionTarget, { mode: "deck" }>).groupId)
    : null;

  return (
    <>
      {deckLabelMeta && labelPosition && (
        <div
          style={{
            position: "fixed",
            left: labelPosition.x,
            top: labelPosition.y - 8,
            transform: "translate(-50%, -100%)",
            zIndex: 550,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--canopy-ds-spacing-2xs)",
            color: "var(--canopy-ds-color-text-icon-text-subtle)",
          }}
        >
          <Text variant="headline-02" as="span">{deckLabelMeta.name ?? "Deck"}</Text>
          <Text variant="caption-01" as="span">— {deckLabelMeta.cardOrder.length}</Text>
        </div>
      )}
      <div style={containerStyle} {...barProps}>
        {target.mode === "graveyard" && renderGraveyardMode()}
        {target.mode === "deck" && renderDeckMode()}
        {target.mode === "card-to-deck" && renderCardToDeckMode()}
        {target.mode === "multi" && renderMultiMode()}
        {target.mode === "single" && renderSingleMode()}
      </div>
    </>
  );
}
