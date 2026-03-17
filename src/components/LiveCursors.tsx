import { useEffect, useRef } from "react";
import type { Editor } from "tldraw";
import { useOthers, useEventListener } from "../liveblocks.config";
import type { CursorBatchEvent } from "../liveblocks.config";

// Playback buffer: hold 100ms of future points so we can interpolate the exact path
const PLAYBACK_DELAY = 100; // ms
// Cap large dt gaps (e.g. after idle) to avoid scheduling points far in the future
const MAX_DT = 200; // ms

type PlaybackPoint = { x: number; y: number; scheduledAt: number };

type RemoteCursorProps = {
  color: string;
  username: string;
  onRef: (el: HTMLDivElement | null) => void;
};

// RemoteCursor only cares about color/username — position is driven directly via DOM ref
// by the RAF loop in LiveCursors, bypassing React re-renders entirely.
function RemoteCursor({ color, username, onRef }: RemoteCursorProps) {
  return (
    <div
      ref={onRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        // Start off-screen until first playback position arrives
        transform: "translate(-9999px, -9999px)",
        pointerEvents: "none",
        zIndex: 600,
        color,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 2L16 10L9.5 11.5L7 17L4 2Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      <div
        style={{
          marginTop: 4,
          marginLeft: 12,
          backgroundColor: color,
          color: "#fff",
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          fontFamily: "sans-serif",
        }}
      >
        {username}
      </div>
    </div>
  );
}

type Props = {
  editor: Editor | null;
};

export function LiveCursors({ editor }: Props) {
  const others = useOthers();

  // Refs stable across renders — position updates never cause React re-renders
  const elementRefsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const playbackRef    = useRef<Map<number, PlaybackPoint[]>>(new Map());
  const editorRef      = useRef<Editor | null>(editor);

  // Keep editorRef current when editor changes
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // Stable ref callbacks per connectionId — same function reference across renders.
  // React 19 calls cleanup (onRef(null)) when a ref callback's reference changes,
  // which would briefly remove elements from elementRefsRef every 60ms when others
  // updates. Caching by connectionId prevents React from seeing a "new" callback.
  const refCallbacksRef = useRef(new Map<number, (el: HTMLDivElement | null) => void>());
  function getRefCallback(connId: number) {
    if (!refCallbacksRef.current.has(connId)) {
      refCallbacksRef.current.set(connId, (el) => {
        if (el) elementRefsRef.current.set(connId, el);
        else elementRefsRef.current.delete(connId);
      });
    }
    return refCallbacksRef.current.get(connId)!;
  }

  // Receive batched cursor points and append to each connection's playback queue
  useEventListener(({ connectionId, event }) => {
    if (event.type !== "cursor-batch") return;
    const { points } = event as CursorBatchEvent;

    let queue = playbackRef.current.get(connectionId);
    if (!queue) {
      queue = [];
      playbackRef.current.set(connectionId, queue);
    }

    const now = performance.now();
    // Continue from last scheduled point — or restart with fresh delay if queue drained
    let t = queue.length > 0
      ? Math.max(queue[queue.length - 1].scheduledAt, now + PLAYBACK_DELAY)
      : now + PLAYBACK_DELAY;

    for (const point of points) {
      t += Math.min(point.dt, MAX_DT);
      queue.push({ x: point.x, y: point.y, scheduledAt: t });
    }
  });

  // RAF loop: interpolate through playback queues and write directly to DOM
  useEffect(() => {
    let rafId = 0;

    function tick() {
      const now = performance.now();
      const ed = editorRef.current;

      for (const [connId, queue] of playbackRef.current) {
        const el = elementRefsRef.current.get(connId);
        if (!el || !ed || queue.length === 0) continue;

        // GC: trim all points that are fully in the past (keep last consumed for hold)
        while (queue.length > 1 && queue[1].scheduledAt <= now) queue.shift();

        const first = queue[0];
        // Not yet time for this batch — hold at current DOM position
        if (now < first.scheduledAt) continue;

        let pagePos: { x: number; y: number };
        if (queue.length === 1) {
          pagePos = { x: first.x, y: first.y };
        } else {
          const second = queue[1];
          const span = second.scheduledAt - first.scheduledAt;
          const t = span > 0 ? Math.min((now - first.scheduledAt) / span, 1) : 1;
          pagePos = {
            x: first.x + (second.x - first.x) * t,
            y: first.y + (second.y - first.y) * t,
          };
        }

        // Convert page → screen fresh each frame (handles pan/zoom changes correctly)
        const screen = ed.pageToScreen(pagePos);
        el.style.transform = `translate(${screen.x - 2}px, ${screen.y - 2}px)`;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // stable — only reads refs, no closures over props

  // GC: clean up queues and refs for disconnected players
  useEffect(() => {
    const activeIds = new Set(others.map(o => o.connectionId));
    for (const id of playbackRef.current.keys()) {
      if (!activeIds.has(id)) {
        playbackRef.current.delete(id);
        elementRefsRef.current.delete(id);
        refCallbacksRef.current.delete(id);
      }
    }
  }, [others]);

  if (!editor) return null;

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        // presence.cursor drives visibility (null = player left canvas)
        // Actual position comes from playback queue via RAF → direct DOM write
        if (!presence.cursor) return null;
        return (
          <RemoteCursor
            key={connectionId}
            color={presence.color}
            username={presence.username}
            onRef={getRefCallback(connectionId)}
          />
        );
      })}
    </>
  );
}
