import { useCallback, useState } from "react";
import { Tldraw, type Editor, type TLComponents } from "tldraw";
import { MtgCardUtil } from "../shapes";
import { CanvasBackground } from "./CanvasBackground";
import { SpawnButton } from "./SpawnButton";
import { CardActions } from "./CardActions";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LiveCursors } from "./LiveCursors";
import { CursorPresence } from "./CursorPresence";

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

export function MtgCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);

  const handleMount = useCallback((mountedEditor: Editor) => {
    // Default to select tool — users move and interact with cards immediately
    mountedEditor.setCurrentTool("select");
    setEditor(mountedEditor);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Tldraw
        hideUi
        shapeUtils={shapeUtils}
        components={components}
        onMount={handleMount}
      >
        {/* CursorPresence renders inside Tldraw's React context */}
        {editor && <CursorPresence editor={editor} />}
      </Tldraw>

      {/* Fixed overlays render outside tldraw's DOM tree */}
      <SpawnButton editor={editor} />
      <CardActions editor={editor} />
      <ThemeSwitcher />
      <LiveCursors />
    </div>
  );
}
