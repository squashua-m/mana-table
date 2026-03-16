/**
 * OracleToggle — book icon button that shows/hides oracle text on card hover.
 *
 * Positioned below the ThemeSwitcher (top-right).
 * When active, hovering any card shows a frosted-glass panel with
 * typeline, oracle text, and flavor text near the cursor.
 */
import { useEffect, useState } from "react";
import { GlassButton, Icon, Text } from "@canopy-ds/react";
import {
  getHoveredCard,
  isOracleMode,
  subscribeHoveredCard,
  subscribeOracleMode,
  toggleOracleMode,
  type HoveredCardOracle,
} from "../stores/oracleStore";

// ─── Oracle panel ─────────────────────────────────────────────────────────────

function OraclePanel({ card, cursorX, cursorY }: { card: HoveredCardOracle; cursorX: number; cursorY: number }) {
  const OFFSET = 16;
  const PANEL_W = 260;
  // Keep panel on screen
  const left = Math.min(cursorX + OFFSET, window.innerWidth - PANEL_W - OFFSET);
  const top = cursorY + OFFSET;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width: PANEL_W,
        zIndex: 600,
        pointerEvents: "none",
        background: "var(--canopy-ds-color-surface-surface-glass)",
        backdropFilter: "blur(var(--canopy-ds-blur-md))",
        WebkitBackdropFilter: "blur(var(--canopy-ds-blur-md))",
        border: "1px solid var(--canopy-ds-color-border-border-glass)",
        borderRadius: "var(--canopy-ds-radius-md)",
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.4),
          inset 0 1px 0 var(--canopy-ds-color-border-border-glass-highlight)
        `,
        padding: "var(--canopy-ds-spacing-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--canopy-ds-spacing-2xs)",
      }}
    >
      {/* Card name */}
      <Text
        variant="headline-02"
        as="p"
        style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
      >
        {card.cardName}
      </Text>

      {/* Type line */}
      {card.typeLine && (
        <Text
          variant="caption-01"
          as="p"
          style={{
            color: "var(--canopy-ds-color-text-icon-text-subtle)",
            margin: 0,
            borderBottom: "1px solid var(--canopy-ds-color-border-border-subtle)",
            paddingBottom: "var(--canopy-ds-spacing-2xs)",
          }}
        >
          {card.typeLine}
        </Text>
      )}

      {/* Oracle text */}
      {card.oracleText && (
        <Text
          variant="body-02"
          as="p"
          style={{
            color: "var(--canopy-ds-color-text-icon-text-default)",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {card.oracleText}
        </Text>
      )}

      {/* Flavor text */}
      {card.flavorText && (
        <Text
          variant="body-02"
          as="p"
          style={{
            color: "var(--canopy-ds-color-text-icon-text-subtle)",
            margin: 0,
            fontStyle: "italic",
            borderTop: card.oracleText
              ? "1px solid var(--canopy-ds-color-border-border-subtle)"
              : undefined,
            paddingTop: card.oracleText ? "var(--canopy-ds-spacing-2xs)" : undefined,
          }}
        >
          {card.flavorText}
        </Text>
      )}
    </div>
  );
}

// ─── OracleToggle ─────────────────────────────────────────────────────────────

export function OracleToggle() {
  const [active, setActive] = useState(isOracleMode);
  const [hoveredCard, setHoveredCardState] = useState<HoveredCardOracle | null>(getHoveredCard);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => subscribeOracleMode(setActive), []);
  useEffect(() => subscribeHoveredCard(setHoveredCardState), []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      {/* Book button — below the ThemeSwitcher */}
      <div
        style={{
          position: "fixed",
          // ThemeSwitcher is at top: spacing-lg (24px), button height ~44px, gap xs (8px)
          top: "calc(var(--canopy-ds-spacing-lg) + 44px + var(--canopy-ds-spacing-xs))",
          right: "var(--canopy-ds-spacing-lg)",
          zIndex: 500,
          pointerEvents: "all",
        }}
      >
        <GlassButton
          size="md"
          iconOnly
          aria-label={active ? "Hide oracle text" : "Show oracle text"}
          onClick={toggleOracleMode}
        >
          <span style={{ color: active ? "var(--canopy-ds-color-text-icon-text-default)" : "var(--canopy-ds-color-text-icon-text-subtle)" }}>
            <Icon name="book" size="sm" />
          </span>
        </GlassButton>
      </div>

      {/* Oracle panel — appears near cursor when a card is hovered */}
      {active && hoveredCard && (
        <OraclePanel card={hoveredCard} cursorX={cursor.x} cursorY={cursor.y} />
      )}
    </>
  );
}
