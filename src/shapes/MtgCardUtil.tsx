/**
 * MtgCardUtil — tldraw v3 ShapeUtil for MTG cards.
 *
 * Physics are handled by MtgCardInner (a proper React function component so hooks are valid).
 * Per card-physics.md: lift on drag, velocity tilt during drag, spring settle on release.
 * Per CLAUDE.md: use canopy-ds radius + elevation tokens, no hardcoded hex/px.
 * Per effects.md: elevation-1 shadow recipe.
 *
 * Tap/Flip architecture:
 *  - shape.rotation is NEVER used — tldraw's transform-origin: top-left would shift position.
 *  - isTapped prop → rotateZ MotionValue (0 or 90, spring-animated, never resets to 0).
 *  - isFlipped prop → flipY MotionValue (0 or 180, spring-animated CSS 3D two-face flip).
 *  - transform-style: preserve-3d on physics + flip layers; overflow: hidden only on face divs.
 *
 * Physics ownership:
 *  - Standalone cards: handlePointerDown here owns scale/tilt/cursorXY.
 *  - Graveyard (grouped) cards: MtgCanvas owns scale/tilt/cursorXY for the top card.
 *    handlePointerDown bails out for grouped cards so there's no conflict.
 *  - MotionValues are always wired to the DOM. Non-top graveyard cards are naturally
 *    inert because their MotionValues are never driven (scale stays 1, cursorXY stays 0).
 */
import { useEffect, useState } from "react";
import { animate, motion, useSpring, useTransform, useVelocity } from "framer-motion";
import { HTMLContainer, Rectangle2d, ShapeUtil, useEditor, type TLShapePartial } from "tldraw";
import {
  CARD_BACK_URL,
  CARD_HEIGHT,
  CARD_WIDTH,
  mtgCardShapeProps,
  type MtgCardShape,
} from "./MtgCardShape";
import { cleanupCardPhysics, getCardPhysics } from "../physics/cardPhysics";
import { addToHand } from "../stores/handStore";
import { setCanvasDragging } from "../stores/dragStore";
import { isOracleMode, setHoveredCard, subscribeOracleMode } from "../stores/oracleStore";

const HAND_DROP_THRESHOLD = 0.80;

// ─── MtgCardInner ────────────────────────────────────────────────────────────

function MtgCardInner({ shape }: { shape: MtgCardShape }) {
  const { imageUrl, isTapped, isFlipped, cardName, typeLine, oracleText, flavorText, w, h } = shape.props;
  const editor = useEditor();

  const [oracleActive, setOracleActive] = useState(isOracleMode);
  useEffect(() => subscribeOracleMode(setOracleActive), []);

  const physics = getCardPhysics(shape.id);

  useEffect(() => {
    return () => cleanupCardPhysics(shape.id);
  }, [shape.id]);

  // Tap animation
  useEffect(() => {
    const target = isTapped ? 90 : 0;
    if (physics.rotateZ.get() === target) return;
    animate(physics.rotateZ, target, {
      type: "spring",
      stiffness: isTapped ? 200 : 400,
      damping: isTapped ? 22 : 28,
      onUpdate: (v) => { void v; },
    });
  }, [isTapped, physics.rotateZ]);

  // Flip animation
  useEffect(() => {
    const target = isFlipped ? 180 : 0;
    if (physics.flipY.get() === target) return;
    animate(physics.flipY, target, {
      type: "spring",
      stiffness: 260,
      damping: 20,
    });
  }, [isFlipped, physics.flipY]);

  // Velocity tilt pipeline — cursor → velocity → spring → degrees
  const velocityX = useVelocity(physics.cursorX);
  const velocityY = useVelocity(physics.cursorY);
  const smoothVX = useSpring(velocityX, { stiffness: 100, damping: 30 });
  const smoothVY = useSpring(velocityY, { stiffness: 100, damping: 30 });
  const rotateY = useTransform(smoothVX, [-500, 500], [-20, 20]);
  const rotateX = useTransform(smoothVY, [-500, 500], [20, -20]);

  // Shadow fades in as card lifts. Non-top graveyard cards never get scale > 1,
  // so their shadow stays transparent naturally — no conditional needed.
  const boxShadow = useTransform(
    physics.scale,
    [1, 1.1],
    [
      "0 24px 48px rgba(0,0,0,0), 0 8px 16px rgba(0,0,0,0)",
      "0 24px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)",
    ]
  );

  // Standalone cards own their own physics. Grouped cards are driven by MtgCanvas.
  const handlePointerDown = (_e: React.PointerEvent) => {
    const currentParentId = editor.getShape(shape.id)?.parentId;
    const currentlyInGroup =
      typeof currentParentId === "string" && currentParentId.startsWith("shape:");

    if (currentlyInGroup) return; // MtgCanvas owns grouped card physics

    editor.bringToFront([shape.id]);
    animate(physics.scale, 1.1, { type: "spring", stiffness: 300, damping: 20 });
    setCanvasDragging(true);

    const onMove = (ev: PointerEvent) => {
      physics.cursorX.set(ev.clientX);
      physics.cursorY.set(ev.clientY);
    };
    const onUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      animate(physics.scale, 1.0, { type: "spring", stiffness: 150, damping: 15 });
      setCanvasDragging(false);

      if (ev.type === "pointerup" && ev.clientY > window.innerHeight * HAND_DROP_THRESHOLD) {
        const currentShape = editor.getShape(shape.id) as MtgCardShape | undefined;
        if (currentShape) {
          addToHand({
            id: crypto.randomUUID(),
            imageUrl: currentShape.props.imageUrl,
            cardName: currentShape.props.cardName,
          });
          editor.deleteShapes([shape.id]);
        }
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  const handlePointerEnter = () => {
    if (!oracleActive) return;
    setHoveredCard({ cardName, typeLine, oracleText, flavorText });
  };

  const handlePointerLeave = () => {
    setHoveredCard(null);
  };

  return (
    <HTMLContainer
      id={shape.id}
      style={{
        width: w,
        height: h,
        pointerEvents: "all",
        perspective: "1000px",
        cursor: "grab",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Physics layer: drag lift/tilt + tap rotateZ.
          MotionValues always wired — non-top graveyard cards are inert
          because MtgCanvas never drives their values. */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          scale: physics.scale,
          rotateX,
          rotateY,
          rotateZ: physics.rotateZ,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Flip layer */}
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            rotateY: physics.flipY,
            transformStyle: "preserve-3d",
            position: "relative",
          }}
        >
          {/* Front face */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "var(--canopy-ds-radius-md)",
              overflow: "hidden",
              border: "1px solid var(--canopy-ds-color-border-border-card)",
              boxShadow,
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={cardName}
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
                }}
              >
                {cardName}
              </div>
            )}
          </motion.div>

          {/* Back face */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "var(--canopy-ds-radius-md)",
              overflow: "hidden",
              border: "1px solid var(--canopy-ds-color-border-border-card)",
              boxShadow,
            }}
          >
            <img
              src={CARD_BACK_URL}
              alt="Card back"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </HTMLContainer>
  );
}

// ─── MtgCardUtil ─────────────────────────────────────────────────────────────

export class MtgCardUtil extends ShapeUtil<MtgCardShape> {
  static override type = "mtg-card" as const;
  static override props = mtgCardShapeProps;

  override getDefaultProps(): MtgCardShape["props"] {
    return {
      imageUrl: "",
      isFlipped: false,
      isTapped: false,
      cardName: "Unknown Card",
      typeLine: "",
      oracleText: "",
      flavorText: "",
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
    };
  }

  override getGeometry(shape: MtgCardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override component(shape: MtgCardShape) {
    return <MtgCardInner shape={shape} />;
  }

  override indicator(_shape: MtgCardShape) {
    return null;
  }

  override onDoubleClick(shape: MtgCardShape): TLShapePartial<MtgCardShape> | void {
    return {
      id: shape.id,
      type: "mtg-card",
      props: { isFlipped: !shape.props.isFlipped },
    };
  }
}
