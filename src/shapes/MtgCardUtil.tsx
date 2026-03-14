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
 */
import { useEffect, useRef } from "react";
import { animate, motion, useSpring, useTransform, useVelocity } from "framer-motion";
import { HTMLContainer, Rectangle2d, ShapeUtil, type TLShapePartial } from "tldraw";
import {
  CARD_BACK_URL,
  CARD_HEIGHT,
  CARD_WIDTH,
  mtgCardShapeProps,
  type MtgCardShape,
} from "./MtgCardShape";
import { cleanupCardPhysics, getCardPhysics } from "../physics/cardPhysics";

// ─── MtgCardInner ────────────────────────────────────────────────────────────
// Extracted as a sub-component so React hooks are valid (ShapeUtil.component() is
// a method, not a function component — hooks must live in actual function components).

function MtgCardInner({ shape }: { shape: MtgCardShape }) {
  const { imageUrl, isTapped, isFlipped, cardName, w, h } = shape.props;

  // Lazy-create stable MotionValues for this shape — persists across re-renders
  const physics = getCardPhysics(shape.id, isTapped, isFlipped);

  // Clean up MotionValues when the shape is removed from the canvas
  useEffect(() => {
    return () => cleanupCardPhysics(shape.id);
  }, [shape.id]);

  // Tap animation — fires when isTapped prop changes
  const prevTapped = useRef(isTapped);
  useEffect(() => {
    if (prevTapped.current === isTapped) return;
    prevTapped.current = isTapped;
    animate(physics.rotateZ, isTapped ? 90 : 0, {
      type: "spring",
      stiffness: isTapped ? 200 : 400,
      damping: isTapped ? 22 : 28,
      onUpdate: (v) => {
        // TODO: play 'card-tap'/'card-untap' sound at peak of overshoot
        // if (isTapped && v >= 90) audioEngine.play('card-tap');
        // if (!isTapped && v <= 0) audioEngine.play('card-untap');
        void v;
      },
    });
  }, [isTapped, physics.rotateZ]);

  // Flip animation — fires when isFlipped prop changes
  const prevFlipped = useRef(isFlipped);
  useEffect(() => {
    if (prevFlipped.current === isFlipped) return;
    prevFlipped.current = isFlipped;
    animate(physics.flipY, isFlipped ? 180 : 0, {
      type: "spring",
      stiffness: 260,
      damping: 20,
    });
  }, [isFlipped, physics.flipY]);

  // Velocity filter pipeline — per card-physics.md "Chaser" logic:
  // cursor position → useVelocity → useSpring (smooths direction changes) → useTransform (maps to degrees)
  // This prevents jerking when drag direction changes (e.g. down → left).
  const velocityX = useVelocity(physics.cursorX);
  const velocityY = useVelocity(physics.cursorY);
  const smoothVX = useSpring(velocityX, { stiffness: 100, damping: 30 });
  const smoothVY = useSpring(velocityY, { stiffness: 100, damping: 30 });
  // Map smoothed velocity range [-500, 500] px/s to tilt degrees [-20, 20]
  // Tighter input range = tilt kicks in at normal drag speeds (not just fast flicks)
  const rotateY = useTransform(smoothVX, [-500, 500], [-20, 20]);
  const rotateX = useTransform(smoothVY, [-500, 500], [20, -20]);

  const handlePointerDown = (_e: React.PointerEvent) => {
    // Lift animation — per card-physics.md: spring stiffness 300, damping 20
    animate(physics.scale, 1.1, { type: "spring", stiffness: 300, damping: 20 });

    // Document-level listeners so we receive events even after tldraw captures the pointer
    const onMove = (ev: PointerEvent) => {
      // Feed raw cursor position — useVelocity derives velocity, useSpring smooths it
      physics.cursorX.set(ev.clientX);
      physics.cursorY.set(ev.clientY);
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);

      // Settle scale — per card-physics.md: low stiffness for "jiggle when hitting table"
      // Tilt settles naturally: cursor stops → velocity → 0 → smoothVX/Y spring to 0 → rotateX/Y → 0
      animate(physics.scale, 1.0, { type: "spring", stiffness: 150, damping: 15 });
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  };

  const shadowStyle = "0 2px 8px rgba(0,0,0,0.33), 0 1px 3px rgba(0,0,0,0.2)";

  return (
    <HTMLContainer
      id={shape.id}
      style={{
        width: w,
        height: h,
        pointerEvents: "all",
        // perspective on the container makes 3D rotateX/Y visible
        perspective: "1000px",
        cursor: "grab",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Physics layer: drag lift/tilt + tap rotateZ */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          scale: physics.scale,
          rotateX: rotateX,
          rotateY: rotateY,
          rotateZ: physics.rotateZ,
          // preserve-3d required so nested flip layer's backface-visibility works
          transformStyle: "preserve-3d",
          // No overflow: hidden here — it would flatten 3D and break backface-visibility
        }}
      >
        {/* Flip layer: rotateY 0 (front) → 180 (back) */}
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: "var(--canopy-ds-radius-md)",
              overflow: "hidden",
              boxShadow: shadowStyle,
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
          </div>

          {/* Back face — pre-rotated 180° so it faces forward when flipY=180 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "var(--canopy-ds-radius-md)",
              overflow: "hidden",
              boxShadow: shadowStyle,
            }}
          >
            <img
              src={CARD_BACK_URL}
              alt="Card back"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
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

  override indicator(shape: MtgCardShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    );
  }

  // Double-click toggles isFlipped (secondary interaction — card action buttons are primary)
  override onDoubleClick(shape: MtgCardShape): TLShapePartial<MtgCardShape> | void {
    return {
      id: shape.id,
      type: "mtg-card",
      props: { isFlipped: !shape.props.isFlipped },
    };
  }
}
