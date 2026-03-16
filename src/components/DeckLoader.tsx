import { useState } from "react";
import { GlassButton, Icon, Text } from "@canopy-ds/react";
import type { Editor } from "tldraw";
import { parseDecklist } from "../utils/parseDecklist";
import { useSpawnDeck } from "../hooks/useSpawnDeck";
import { TEST_DECK_01 } from "../data/decks";

type Props = {
  editor: Editor | null;
};

// Canonical glassmorphism recipe from effects.md — floating panel (elevation-2)
const glassPanelStyle: React.CSSProperties = {
  background: "var(--canopy-ds-color-surface-surface-glass)",
  backdropFilter: "blur(var(--canopy-ds-blur-md))",
  WebkitBackdropFilter: "blur(var(--canopy-ds-blur-md))",
  border: "1px solid var(--canopy-ds-color-border-border-glass)",
  borderRadius: "var(--canopy-ds-radius-md)",
  boxShadow: `
    var(--canopy-ds-elevation-2-a-offset-x) var(--canopy-ds-elevation-2-a-offset-y)
    var(--canopy-ds-elevation-2-a-blur) var(--canopy-ds-elevation-2-a-spread)
    var(--canopy-ds-elevation-2-a-color),
    var(--canopy-ds-elevation-2-b-offset-x) var(--canopy-ds-elevation-2-b-offset-y)
    var(--canopy-ds-elevation-2-b-blur) var(--canopy-ds-elevation-2-b-spread)
    var(--canopy-ds-elevation-2-b-color),
    inset 0 1px 0 var(--canopy-ds-color-border-border-glass-highlight),
    inset 0 -1px 0 var(--canopy-ds-color-border-border-glass-highlight)
  `,
  padding: "var(--canopy-ds-spacing-md)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--canopy-ds-spacing-xs)",
  width: 320,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  padding: "var(--canopy-ds-spacing-xs)",
  fontFamily: "monospace",
  fontSize: 12,
  lineHeight: 1.5,
  outline: "none",
};

export function DeckLoader({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { spawnDeck, progress } = useSpawnDeck(editor);

  const isLoading = progress !== null;

  const handleLoad = async () => {
    const entries = parseDecklist(text);
    if (!entries.length) return;
    setOpen(false);
    setText("");
    await spawnDeck(entries);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--canopy-ds-spacing-lg)",
        left: `calc(var(--canopy-ds-spacing-lg) + 152px)`,
        zIndex: 500,
        pointerEvents: "all",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--canopy-ds-spacing-xs)",
      }}
    >
      {open && (
        <div style={glassPanelStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              variant="headline-02"
              as="p"
              style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
            >
              Paste MTGA decklist
            </Text>
            <GlassButton
              size="sm"
              aria-label="Load test deck 01"
              onClick={() => setText(TEST_DECK_01)}
            >
              <Text variant="caption-01" as="span" style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}>
                test deck 01
              </Text>
            </GlassButton>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Deck\n4 Llanowar Elves (FDN) 227\n20 Forest (FDN) 281"}
            rows={12}
            style={textareaStyle}
          />
          <GlassButton
            size="sm"
            disabled={!text.trim() || isLoading}
            onClick={handleLoad}
            aria-label="Load deck"
          >
            <span style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-2xs)", color: "var(--canopy-ds-color-text-icon-text-default)" }}>
              <Icon name="download" size="sm" />
              <Text variant="headline-02" as="span">Load Deck</Text>
            </span>
          </GlassButton>
        </div>
      )}

      {isLoading ? (
        <GlassButton size="lg" disabled aria-label="Loading deck">
          <span style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-xs)", color: "var(--canopy-ds-color-text-icon-text-subtle)" }}>
            <Icon name="loader" size="sm" />
            <Text variant="headline-02" as="span">
              {progress.loaded}/{progress.total}
            </Text>
          </span>
        </GlassButton>
      ) : (
        <GlassButton
          size="lg"
          aria-label={open ? "Close deck loader" : "Load deck"}
          onClick={() => setOpen((o) => !o)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-xs)", color: "var(--canopy-ds-color-text-icon-text-default)" }}>
            <Icon name={open ? "x" : "book-open"} size="sm" />
            <Text variant="headline-02" as="span">{open ? "Close" : "Load Deck"}</Text>
          </span>
        </GlassButton>
      )}
    </div>
  );
}
