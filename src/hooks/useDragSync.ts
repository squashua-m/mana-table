import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import type { Editor, TLShapeId } from "tldraw";
import { getCardPhysics } from "../physics/cardPhysics";
import {
  useUpdateMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
} from "../liveblocks.config";
import type { DragBatchEvent } from "../liveblocks.config";
import { activeDragShapes, removeFromActiveDrag } from "../stores/dragState";

// Match cursor's playback delay so card and cursor arrive at destinations in sync
const PLAYBACK_DELAY = 100; // ms
const MAX_DT = 200;         // ms — cap large idle gaps

type DragPlaybackPoint = { x: number; y: number; scheduledAt: number };

export function useDragSync(editor: Editor | null): void {
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();
  const others = useOthers();

  // Keep editorRef current for use inside stable RAF effect
  const editorRef = useRef<Editor | null>(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // ── Outbound: buffer drag waypoints, broadcast as drag-batch every 60ms ──
  const dragBatchBufferRef   = useRef<Array<{ x: number; y: number; dt: number }>>([]);
  const lastDragPointTimeRef = useRef(performance.now());
  const currentDragShapeRef  = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    const unsubStore = editor.store.listen(
      ({ changes }) => {
        // Guard: tldraw sets isDragging=false synchronously on pointerup, before our
        // document listener fires. Any RAF-deferred store commits (e.g. final snap)
        // that arrive after handlePointerUp would otherwise re-set dragging: {shapeId},
        // overwriting the dragging: null we just sent and leaving remote cards stuck.
        if (!editor.inputs.isDragging) return;

        for (const pair of Object.values(changes.updated)) {
          const [before, after] = pair as [
            { typeName: string; id: string; x: number; y: number },
            { typeName: string; id: string; x: number; y: number }
          ];
          if (after.typeName !== "shape") continue;
          if (before.x === after.x && before.y === after.y) continue;

          const now = performance.now();
          dragBatchBufferRef.current.push({
            x: after.x,
            y: after.y,
            dt: now - lastDragPointTimeRef.current,
          });
          lastDragPointTimeRef.current = now;
          currentDragShapeRef.current = after.id;

          // Signal drag start via presence (shapeId only — positions via broadcast)
          updateMyPresence({ dragging: { shapeId: after.id } });
          break;
        }
      },
      { source: "user" }
    );

    // Flush accumulated waypoints every 60ms
    const intervalId = setInterval(() => {
      if (dragBatchBufferRef.current.length === 0 || !currentDragShapeRef.current) return;
      const points = dragBatchBufferRef.current;
      dragBatchBufferRef.current = [];
      broadcast({ type: "drag-batch", shapeId: currentDragShapeRef.current, points });
    }, 60);

    // Drag end fires immediately — remote clients need this promptly to trigger drop animation
    const handlePointerUp = () => {
      dragBatchBufferRef.current = [];
      currentDragShapeRef.current = null;
      updateMyPresence({ dragging: null });
    };
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      unsubStore();
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      clearInterval(intervalId);
    };
  }, [editor, updateMyPresence, broadcast]);

  // ── Inbound: playback queue per shapeId → RAF interpolation → tldraw store ─
  const dragPlaybackRef = useRef<Map<string, DragPlaybackPoint[]>>(new Map());

  // Append incoming drag-batch points to the shapeId's playback queue
  useEventListener(({ event }) => {
    if (event.type !== "drag-batch") return;
    const { shapeId, points } = event as DragBatchEvent;

    let queue = dragPlaybackRef.current.get(shapeId);
    if (!queue) {
      queue = [];
      dragPlaybackRef.current.set(shapeId, queue);
      // Claim position authority — suppress useTldrawSync Storage updates for this shape
      activeDragShapes.add(shapeId);
    }

    const now = performance.now();
    let t = queue.length > 0
      ? Math.max(queue[queue.length - 1].scheduledAt, now + PLAYBACK_DELAY)
      : now + PLAYBACK_DELAY;

    for (const pt of points) {
      t += Math.min(pt.dt, MAX_DT);
      queue.push({ x: pt.x, y: pt.y, scheduledAt: t });
    }
  });

  // Stable RAF loop: interpolate through all active drag queues, write to tldraw store
  useEffect(() => {
    let rafId = 0;

    function tick() {
      const now = performance.now();
      const ed = editorRef.current;

      if (ed) {
        for (const [shapeId, queue] of dragPlaybackRef.current) {
          // GC: trim points already passed
          while (queue.length > 1 && queue[1].scheduledAt <= now) queue.shift();
          if (queue.length === 0) continue;

          const first = queue[0];
          if (now < first.scheduledAt) continue; // not yet time — hold position

          let pos: { x: number; y: number };
          if (queue.length === 1) {
            pos = { x: first.x, y: first.y };
          } else {
            const second = queue[1];
            const span = second.scheduledAt - first.scheduledAt;
            const t = span > 0 ? Math.min((now - first.scheduledAt) / span, 1) : 1;
            pos = {
              x: first.x + (second.x - first.x) * t,
              y: first.y + (second.y - first.y) * t,
            };
          }

          const shape = ed.getShape(shapeId as TLShapeId);
          if (shape) {
            ed.store.mergeRemoteChanges(() => {
              ed.store.put([{ ...shape, x: pos.x, y: pos.y }]);
            });
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // stable — only reads refs

  // ── Scale animations + velocity tilt: driven by presence.dragging diffs ───
  const prevDraggingRef = useRef<Record<number, string | null>>({});

  useEffect(() => {
    if (!editor) return;

    const currentConnectionIds = new Set(others.map(o => o.connectionId));

    for (const { connectionId, presence } of others) {
      const { dragging, cursor } = presence;
      const prevShapeId = prevDraggingRef.current[connectionId] ?? null;
      const currShapeId = dragging?.shapeId ?? null;

      // Drag start → lift card
      if (currShapeId && currShapeId !== prevShapeId) {
        animate(getCardPhysics(currShapeId).scale, 1.1, {
          type: "spring",
          stiffness: 300,
          damping: 20,
        });
      }

      // Drag end → drop card, schedule queue GC after buffer drains
      if (!currShapeId && prevShapeId) {
        const p = getCardPhysics(prevShapeId);
        animate(p.scale, 1.0, { type: "spring", stiffness: 150, damping: 15 });
        // Don't reset cursorX/Y to 0 — that causes a velocity spike in useVelocity
        // which produces a top-left tilt. Stopping updates is enough: once currShapeId
        // is null the cursor update block below stops running, velocity decays naturally.
        // Let 300ms pass so the 100ms playback buffer fully drains before GC,
        // then release position authority back to useTldrawSync Storage sync
        setTimeout(() => {
          dragPlaybackRef.current.delete(prevShapeId);
          removeFromActiveDrag(prevShapeId);
        }, 300);
      }

      prevDraggingRef.current[connectionId] = currShapeId;

      // Velocity tilt: drive cursorX/Y from remote cursor position
      if (cursor && currShapeId) {
        const screenPos = editor.pageToScreen({ x: cursor.x, y: cursor.y });
        const p = getCardPhysics(currShapeId);
        p.cursorX.set(screenPos.x);
        p.cursorY.set(screenPos.y);
      }
    }

    // Clean up cards from players who disconnected while dragging
    for (const [cIdStr, prevShapeId] of Object.entries(prevDraggingRef.current)) {
      const cId = Number(cIdStr);
      if (prevShapeId && !currentConnectionIds.has(cId)) {
        const p = getCardPhysics(prevShapeId);
        animate(p.scale, 1.0, { type: "spring", stiffness: 150, damping: 15 });
        setTimeout(() => {
          dragPlaybackRef.current.delete(prevShapeId);
          removeFromActiveDrag(prevShapeId);
        }, 300);
        delete prevDraggingRef.current[cId];
      }
    }
  }, [editor, others]);
}
