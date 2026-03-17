/**
 * Shared mutable set of shape IDs currently under drag-playback control.
 *
 * While a shape is in this set, useTldrawSync inbound will skip immediate
 * Storage position updates for it — useDragSync playback is the sole
 * position authority during that window.
 *
 * Use removeFromActiveDrag() instead of activeDragShapes.delete() directly
 * so that useTldrawSync can flush its buffered pending update for the shape.
 */
export const activeDragShapes = new Set<string>();

type CleanupCallback = (shapeId: string) => void;
const cleanupCallbacks = new Set<CleanupCallback>();

/**
 * Subscribe to be notified when a shape's drag-playback window closes.
 * Returns an unsubscribe function.
 */
export function onDragShapeCleaned(cb: CleanupCallback): () => void {
  cleanupCallbacks.add(cb);
  return () => cleanupCallbacks.delete(cb);
}

/**
 * Remove a shape from drag-playback control and notify subscribers so they
 * can apply any Storage updates that were buffered during the drag window.
 */
export function removeFromActiveDrag(shapeId: string): void {
  activeDragShapes.delete(shapeId);
  cleanupCallbacks.forEach(cb => cb(shapeId));
}
