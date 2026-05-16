import { useEffect, useState } from "react";
import { GlassButton, Icon } from "@canopy-ds/react";
import { useSelf, useUpdateMyPresence } from "../liveblocks.config";
import { deckStorageKey } from "../utils/deckBuilder";

// Floating top-right button that returns the player to the DeckBuilder.
// Only renders when this client has a persisted deck allocation in
// sessionStorage — i.e. they completed a draft + builder this session.
// Spectators (and anyone who refreshed) see nothing.
export function BackToBuilder() {
  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();
  const myId = self?.connectionId ?? null;
  const [hasDeck, setHasDeck] = useState(false);

  // Allocation key is written once during the first builder visit and never
  // deleted, so a single mount-time check is sufficient — the value never
  // flips back to absent for the rest of the session.
  useEffect(() => {
    if (myId === null) {
      setHasDeck(false);
      return;
    }
    setHasDeck(sessionStorage.getItem(deckStorageKey(myId)) !== null);
  }, [myId]);

  if (!hasDeck) return null;

  return (
    <div
      style={{
        position: "fixed",
        // Stacked below OracleToggle (which sits below ThemeSwitcher).
        // ThemeSwitcher: spacing-lg; each subsequent button: +44px + spacing-xs.
        top: "calc(var(--canopy-ds-spacing-lg) + 2 * (44px + var(--canopy-ds-spacing-xs)))",
        right: "var(--canopy-ds-spacing-lg)",
        zIndex: 500,
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="md"
        iconOnly
        aria-label="Back to deck builder"
        onClick={() => updateMyPresence({ screen: "deck-build" })}
      >
        <span style={{ color: "var(--canopy-ds-color-text-icon-text-default)" }}>
          <Icon name="edit-3" size="sm" />
        </span>
      </GlassButton>
    </div>
  );
}
