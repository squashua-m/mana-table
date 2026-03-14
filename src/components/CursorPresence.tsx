import { useEffect } from "react";
import type { Editor } from "tldraw";
import { useUpdateMyPresence } from "../liveblocks.config";

type Props = {
  editor: Editor;
};

/**
 * Invisible component that syncs the local pointer position to Liveblocks Presence.
 * Cursor coords are stored as viewport/screen coords (clientX/clientY), not page coords.
 * This ensures cursors render stably on all clients regardless of their zoom level.
 */
export function CursorPresence({ editor }: Props) {
  const updateMyPresence = useUpdateMyPresence();

  useEffect(() => {
    const container = editor.getContainer();

    const handlePointerMove = (e: PointerEvent) => {
      updateMyPresence({
        cursor: { x: e.clientX, y: e.clientY },
      });
    };

    const handlePointerLeave = () => {
      updateMyPresence({ cursor: null });
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [editor, updateMyPresence]);

  return null;
}
