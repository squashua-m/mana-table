import { useCallback, useEffect, useState } from "react";
import { Tldraw, type Editor, type TLComponents, type TLShapeId } from "tldraw";
import { MtgCardUtil } from "../shapes";
import type { MtgCardShape } from "../shapes";
import { CanvasBackground } from "./CanvasBackground";
import { SpawnButton } from "./SpawnButton";
import { CardActions } from "./CardActions";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { OracleToggle } from "./OracleToggle";
import { LiveCursors } from "./LiveCursors";
import { CursorPresence } from "./CursorPresence";
import { StackContextMenu } from "./StackContextMenu";
import { DeckLoader } from "./DeckLoader";
import { ArcHand } from "./ArcHand";
import { animate } from "framer-motion";
import { getAllStackIds, removeStack, getStack, hasGraveyard, hasDeck, getDeckGroupId } from "../stores/stackStore";
import { getCardPhysics } from "../physics/cardPhysics";
import {
  findNearestOverlappingCard,
  stackOnTop,
  tuckUnderneath,
  addCardToGraveyard,
  drawFromDeck,
  shuffleDeck,
  removeTopCardFromStack,
} from "../utils/stackOperations";
import { addToHand } from "../stores/handStore";
import { setCanvasDragging } from "../stores/dragStore";

const HAND_DROP_THRESHOLD = 0.80;

const shapeUtils = [MtgCardUtil];

/**
 * tldraw component overrides:
 * - Background: uses canopy-ds surface-base token (theme-aware)
 * - Grid: null — clean table surface with no dot grid
 * Per CLAUDE.md: hideUi removes toolbar, drawing tools, menus, and tldraw logo.
 */
const components: TLComponents = {
  Background: CanvasBackground,
  Grid: null,
};

type ContextMenuState = {
  cardId: string;
  groupId: string;
  screenX: number;
  screenY: number;
};

export function MtgCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleMount = useCallback((mountedEditor: Editor) => {
    mountedEditor.setCurrentTool("select");
    setEditor(mountedEditor);
  }, []);

  // Wire up context menu and hotkeys once editor is available
  useEffect(() => {
    if (!editor) return;

    const container = editor.getContainer();

    // ── Stack physics (top card only) ───────────────────────────────────────
    let activeTopCardId: string | null = null;

    const handleEditorEvent = (info: { type: string; name: string }) => {
      if (info.type !== "pointer") return;

      if (info.name === "pointer_down") {
        activeTopCardId = null;

        const candidates = [
          ...editor.getSelectedShapes(),
          editor.getShapeAtPoint(editor.inputs.currentPagePoint, { hitInside: true }),
        ].filter(Boolean);

        for (const shape of candidates) {
          const groupShape =
            shape!.type === "group"
              ? shape!
              : editor.getShape(shape!.parentId as TLShapeId);
          if (!groupShape || groupShape.type !== "group") continue;
          const meta = getStack(groupShape.id);
          if (!meta) continue;
          activeTopCardId = meta.cardOrder[meta.cardOrder.length - 1];
          animate(getCardPhysics(activeTopCardId).scale, 1.1, { type: "spring", stiffness: 300, damping: 20 });
          setCanvasDragging(true);
          break;
        }
      }

      if (info.name === "pointer_up" && activeTopCardId) {
        const p = getCardPhysics(activeTopCardId);
        animate(p.scale, 1.0, { type: "spring", stiffness: 150, damping: 15 });
        p.cursorX.set(0);
        p.cursorY.set(0);
        setCanvasDragging(false);

        if (editor.inputs.currentScreenPoint.y > window.innerHeight * HAND_DROP_THRESHOLD) {
          const topShape = editor.getShape(activeTopCardId as TLShapeId);
          if (topShape) {
            const groupId = topShape.parentId as string;
            if (groupId.startsWith("shape:")) {
              const meta = getStack(groupId);
              if (meta) {
                const drawn =
                  meta.type === "deck"
                    ? drawFromDeck(editor)
                    : removeTopCardFromStack(editor, groupId);
                if (drawn) addToHand(drawn);
              }
            }
          }
        }

        activeTopCardId = null;
      }
    };

    const handleStackPointerMove = (e: PointerEvent) => {
      if (!activeTopCardId) return;
      const p = getCardPhysics(activeTopCardId);
      p.cursorX.set(e.clientX);
      p.cursorY.set(e.clientY);
    };

    // ── Post-drag deselection ───────────────────────────────────────────────
    const handlePointerUp = () => {
      queueMicrotask(() => editor.selectNone());
    };

    // ── Right-click context menu (unstack) ──────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });

      const hit = editor.getShapeAtPoint(pagePoint, { hitInside: true });
      if (!hit) return;

      let cardShape = hit.type === "mtg-card" ? hit : null;

      if (!cardShape && hit.type === "group") {
        const childIds = editor.getSortedChildIdsForParent(hit.id);
        for (const childId of childIds) {
          const child = editor.getShape(childId);
          if (child?.type === "mtg-card") {
            cardShape = child;
            break;
          }
        }
      }

      if (!cardShape) return;

      const parentId = cardShape.parentId;
      if (typeof parentId !== "string" || !parentId.startsWith("shape:")) return;

      const stackMeta = getStack(parentId);
      if (!stackMeta) return;

      e.preventDefault();
      setContextMenu({
        cardId: cardShape.id,
        groupId: parentId,
        screenX: e.clientX,
        screenY: e.clientY,
      });
    };

    // ── Undo/redo sync: clean up orphaned stack entries ─────────────────────
    const cleanupStaleStacks = editor.store.listen(() => {
      for (const gid of getAllStackIds()) {
        if (!editor.getShape(gid as TLShapeId)) {
          removeStack(gid);
        }
      }
    });

    // ── Hotkeys (logic-only, no UI) ─────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as Element).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const selected = editor.getSelectedShapes();
      const card =
        selected.length === 1 && selected[0].type === "mtg-card"
          ? (selected[0] as MtgCardShape)
          : null;

      switch (e.key.toLowerCase()) {
        case "t":
          if (card)
            editor.updateShape<MtgCardShape>({
              id: card.id,
              type: "mtg-card",
              props: { isTapped: !card.props.isTapped },
            });
          break;
        case "f":
          if (card)
            editor.updateShape<MtgCardShape>({
              id: card.id,
              type: "mtg-card",
              props: { isFlipped: !card.props.isFlipped },
            });
          break;
        case "]":
          if (card) {
            const t = findNearestOverlappingCard(editor, card.id);
            if (t) stackOnTop(editor, card.id, t);
          }
          break;
        case "[":
          if (card) {
            const t = findNearestOverlappingCard(editor, card.id);
            if (t) tuckUnderneath(editor, card.id, t);
          }
          break;
        case "e":
          if (card && hasGraveyard()) addCardToGraveyard(editor, card.id);
          break;
        case "s":
          if (hasDeck()) shuffleDeck(editor);
          break;
        case "d": {
          const deckId = getDeckGroupId();
          if (!deckId) break;
          const deckSelected = selected.some(
            (s) => s.id === deckId || s.parentId === deckId
          );
          const hovered = editor.getShapeAtPoint(editor.inputs.currentPagePoint, { hitInside: true });
          const deckHovered = !!hovered && (hovered.id === deckId || hovered.parentId === deckId);
          if (deckSelected || deckHovered) {
            const drawn = drawFromDeck(editor);
            if (drawn) addToHand(drawn);
          }
          break;
        }
      }
    };

    editor.on("event", handleEditorEvent as Parameters<typeof editor.on<"event">>[1]);
    document.addEventListener("pointermove", handleStackPointerMove, { capture: true });
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("contextmenu", handleContextMenu as EventListener);
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      editor.off("event", handleEditorEvent as Parameters<typeof editor.on<"event">>[1]);
      document.removeEventListener("pointermove", handleStackPointerMove, { capture: true });
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("contextmenu", handleContextMenu as EventListener);
      container.removeEventListener("keydown", handleKeyDown);
      cleanupStaleStacks();
    };
  // editor is stable after mount; this effect runs once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Tldraw
        hideUi
        shapeUtils={shapeUtils}
        components={components}
        onMount={handleMount}
      >
        {editor && <CursorPresence editor={editor} />}
      </Tldraw>

      <SpawnButton editor={editor} />
      <DeckLoader editor={editor} />
      <CardActions editor={editor} />
      <ArcHand editor={editor} />
      <ThemeSwitcher />
      <OracleToggle />
      <LiveCursors />

      {contextMenu && editor && (
        <StackContextMenu
          editor={editor}
          cardId={contextMenu.cardId}
          groupId={contextMenu.groupId}
          screenX={contextMenu.screenX}
          screenY={contextMenu.screenY}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
