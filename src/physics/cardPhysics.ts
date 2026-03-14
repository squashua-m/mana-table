/**
 * Card physics store — module-level MotionValue registry per shapeId.
 *
 * Why module-level (not React state): MotionValues must persist across re-renders
 * since tldraw re-renders shape components frequently. Using React state would
 * reset MotionValues and break in-progress animations.
 *
 * Per card-physics.md:
 *  - Tap spring: stiffness 200, damping 12 (allows overshoot to ~94°)
 *  - Untap spring: stiffness 400, damping 20 (snappy "wrist snap" feel)
 *  - Flip spring: stiffness 260, damping 20
 *
 * Architecture: shape.rotation is never used for tap state.
 * isTapped prop drives rotateZ via useEffect in MtgCardInner.
 * isFlipped prop drives flipY via useEffect in MtgCardInner.
 */
import { motionValue, type MotionValue } from "framer-motion";

export type CardPhysics = {
  scale: MotionValue<number>;
  /** Cursor screen position — updated on pointermove. useVelocity derives velocity,
   *  which is spring-smoothed in MtgCardInner to produce jerk-free tilt. */
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  rotateZ: MotionValue<number>; // tap state: 0 (untapped) or 90 (tapped), never resets to 0
  flipY: MotionValue<number>;   // flip state: 0 (front) or 180 (back)
};

const store = new Map<string, CardPhysics>();

export function getCardPhysics(
  shapeId: string,
  isTapped = false,
  isFlipped = false
): CardPhysics {
  if (!store.has(shapeId)) {
    store.set(shapeId, {
      scale: motionValue(1),
      cursorX: motionValue(0),
      cursorY: motionValue(0),
      rotateZ: motionValue(isTapped ? 90 : 0),
      flipY: motionValue(isFlipped ? 180 : 0),
    });
  }
  return store.get(shapeId)!;
}

export function cleanupCardPhysics(shapeId: string): void {
  store.delete(shapeId);
}
