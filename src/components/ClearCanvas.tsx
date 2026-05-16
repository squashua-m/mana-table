import { GlassButton, Icon } from "@canopy-ds/react";
import type { Editor } from "tldraw";
import { clearAllStacks } from "../stores/stackStore";
import { clearHand } from "../stores/handStore";
import { endPeek } from "../stores/peekStore";

type Props = {
  editor: Editor | null;
};

export function ClearCanvas({ editor }: Props) {
  const handleClear = () => {
    if (!editor) return;
    // Delete all shapes from the canvas
    const allShapeIds = editor.getCurrentPageShapeIds();
    editor.deleteShapes([...allShapeIds]);
    // Reset all in-memory stores
    clearAllStacks();
    clearHand();
    endPeek();
  };

  return (
    <div
      style={{
        position: "fixed",
        // OracleToggle (book) is at spacing-lg + 44px + spacing-xs from top.
        // This button sits one more step below it.
        top: "calc(var(--canopy-ds-spacing-lg) + 44px + var(--canopy-ds-spacing-xs) + 44px + var(--canopy-ds-spacing-xs))",
        right: "var(--canopy-ds-spacing-lg)",
        zIndex: 500,
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="md"
        iconOnly
        aria-label="Clear canvas"
        onClick={handleClear}
      >
        <span style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}>
          <Icon name="trash-2" size="sm" />
        </span>
      </GlassButton>
    </div>
  );
}
