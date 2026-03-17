import { useEffect, useRef } from "react";
import type { Editor } from "tldraw";
import { useUpdateMyPresence, useBroadcastEvent } from "../liveblocks.config";

type Props = {
  editor: Editor;
};

/**
 * Invisible component that syncs the local pointer position to Liveblocks.
 *
 * Movement uses useBroadcastEvent for high-fidelity path batching (Figma-style):
 * - Every pointermove pushes {x, y, dt} into a buffer (dt = ms since last point)
 * - A setInterval broadcasts the buffer every 60ms so receivers can replay the
 *   exact path at the exact speed it was drawn
 * - presence.cursor is updated to the last point of each batch for new-joiner seeding
 *
 * Visibility (cursor null / non-null) is still signaled via presence so new
 * joiners can determine whether to show a cursor element at all.
 */
export function CursorPresence({ editor }: Props) {
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();

  const batchBufferRef = useRef<Array<{ x: number; y: number; dt: number }>>([]);
  const lastPointTimeRef = useRef(performance.now());

  useEffect(() => {
    const container = editor.getContainer();

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
      batchBufferRef.current.push({
        x: pagePoint.x,
        y: pagePoint.y,
        dt: now - lastPointTimeRef.current,
      });
      lastPointTimeRef.current = now;
    };

    const handlePointerLeave = () => {
      batchBufferRef.current = [];
      updateMyPresence({ cursor: null });
    };

    // Broadcast accumulated points every 60ms
    const intervalId = setInterval(() => {
      if (batchBufferRef.current.length === 0) return;
      const points = batchBufferRef.current;
      batchBufferRef.current = [];
      broadcast({ type: "cursor-batch", points });
      // Keep presence cursor at last known position for new-joiner seeding
      const last = points[points.length - 1];
      updateMyPresence({ cursor: { x: last.x, y: last.y } });
    }, 60);

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      clearInterval(intervalId);
    };
  }, [editor, updateMyPresence, broadcast]);

  useEffect(() => {
    return editor.store.listen(
      () => {
        updateMyPresence({ selectedShapeIds: editor.getSelectedShapeIds() });
      },
      { source: "user" }
    );
  }, [editor, updateMyPresence]);

  return null;
}
