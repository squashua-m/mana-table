import { useEffect, useRef } from "react";
import { Menu, MenuItem } from "@canopy-ds/react";
import type { Editor, TLShapeId } from "tldraw";
import { createShapeId } from "tldraw";
import * as stackStore from "../stores/stackStore";

type Props = {
  editor: Editor;
  cardId: string;
  groupId: string;
  screenX: number;
  screenY: number;
  onClose: () => void;
};

function handleUnstack(editor: Editor, groupId: string, onClose: () => void): void {
  stackStore.removeStack(groupId);
  editor.ungroupShapes([groupId as TLShapeId]);
  onClose();
}

function handleRemoveFromStack(
  editor: Editor,
  cardId: string,
  groupId: string,
  onClose: () => void
): void {
  const meta = stackStore.getStack(groupId);
  if (!meta) { onClose(); return; }

  const wasGraveyard = stackStore.getGraveyardGroupId() === groupId;
  const remainingOrder = meta.cardOrder.filter((id) => id !== cardId);

  stackStore.removeStack(groupId);
  editor.ungroupShapes([groupId as TLShapeId]);

  if (remainingOrder.length < 2) { onClose(); return; }

  const newGroupId = createShapeId();
  editor.groupShapes(remainingOrder as TLShapeId[], { groupId: newGroupId });
  stackStore.registerStack(newGroupId, { type: meta.type, cardOrder: remainingOrder });
  if (wasGraveyard) stackStore.setGraveyard(newGroupId);

  onClose();
}

export function StackContextMenu({
  editor,
  cardId,
  groupId,
  screenX,
  screenY,
  onClose,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const t = setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const meta = stackStore.getStack(groupId);
  const cardCount = meta?.cardOrder.length ?? 0;
  const showRemove = cardCount >= 3;

  const left = Math.min(screenX + 8, window.innerWidth - 200);
  const top = Math.min(screenY + 8, window.innerHeight - 160);

  return (
    <div
      ref={menuRef}
      style={{ position: "fixed", left, top, zIndex: 700, pointerEvents: "all" }}
    >
      <Menu aria-label="Stack actions">
        <MenuItem
          label="Unstack"
          onClick={() => handleUnstack(editor, groupId, onClose)}
        />
        {showRemove && (
          <MenuItem
            label="Remove from Stack"
            onClick={() => handleRemoveFromStack(editor, cardId, groupId, onClose)}
          />
        )}
      </Menu>
    </div>
  );
}
