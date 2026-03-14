/**
 * CardActions — floating action bar that appears below a selected MtgCard.
 *
 * Per effects.md: glassmorphism recipe with surface-glass + blur-md + border-glass.
 * Per components.md: GlassButton size="sm" iconOnly for compact action buttons.
 * Per iconography.md: layers (flip), rotate-cw (tap), rotate-ccw (untap).
 * Per spacing.md: spacing-2xs (4px) for gap, spacing-xs (8px) for offset.
 *
 * Tap state reads shape.props.isTapped directly — no physics store needed.
 * Tap/flip animations are driven by prop changes; MtgCardInner's useEffect fires them.
 */
import { useEffect, useState } from "react";
import { GlassButton, Icon } from "@canopy-ds/react";
import type { Editor } from "tldraw";
import type { MtgCardShape } from "../shapes";

type Props = {
  editor: Editor | null;
};

type Position = { x: number; y: number };

export function CardActions({ editor }: Props) {
  const [shape, setShape] = useState<MtgCardShape | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen(() => {
      const selected = editor.getSelectedShapes();

      if (selected.length === 1 && selected[0].type === "mtg-card") {
        const card = selected[0] as MtgCardShape;
        const bounds = editor.getShapePageBounds(card.id);

        if (bounds) {
          const screenPos = editor.pageToScreen({
            x: bounds.midX,
            y: bounds.maxY,
          });
          setPosition(screenPos);
          setShape(card);
        }
      } else {
        setShape(null);
        setPosition(null);
      }
    });

    return cleanup;
  }, [editor]);

  if (!shape || !position || !editor) return null;

  const isTapped = shape.props.isTapped;

  const handleFlip = () => {
    editor.updateShape<MtgCardShape>({
      id: shape.id,
      type: "mtg-card",
      props: { isFlipped: !shape.props.isFlipped },
    });
  };

  const handleTapToggle = () => {
    editor.updateShape<MtgCardShape>({
      id: shape.id,
      type: "mtg-card",
      props: { isTapped: !isTapped },
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y + 8,
        transform: "translateX(-50%)",
        zIndex: 550,
        pointerEvents: "all",
        display: "flex",
        gap: "var(--canopy-ds-spacing-2xs)",
        alignItems: "center",
        // Glassmorphism recipe per effects.md
        background: "var(--canopy-ds-color-surface-surface-glass)",
        backdropFilter: "blur(var(--canopy-ds-blur-md))",
        WebkitBackdropFilter: "blur(var(--canopy-ds-blur-md))",
        border: "1px solid var(--canopy-ds-color-border-border-glass)",
        borderRadius: "var(--canopy-ds-radius-round)",
        padding: "var(--canopy-ds-spacing-2xs)",
      }}
    >
      {/* Flip card — toggle front/back */}
      <GlassButton
        size="sm"
        iconOnly
        aria-label={shape.props.isFlipped ? "Unflip card" : "Flip card"}
        onClick={handleFlip}
      >
        <Icon name="layers" size="sm" />
      </GlassButton>

      {/* Tap / Untap — spring-animated rotation via MtgCardInner useEffect */}
      <GlassButton
        size="sm"
        iconOnly
        aria-label={isTapped ? "Untap card" : "Tap card"}
        onClick={handleTapToggle}
      >
        <Icon name={isTapped ? "rotate-ccw" : "rotate-cw"} size="sm" />
      </GlassButton>
    </div>
  );
}
