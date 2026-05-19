import { useState } from "react";
import { GlassButton, Heading, Icon, Text } from "@canopy-ds/react";
import { generateRoomId, normalizeRoomId } from "../utils/generateRoomId";

const pageStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "var(--canopy-ds-color-surface-surface-base)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--canopy-ds-spacing-lg)",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--canopy-ds-spacing-lg)",
  width: "100%",
  maxWidth: 420,
};

const joinPanelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--canopy-ds-spacing-sm)",
  padding: "var(--canopy-ds-spacing-md)",
  background: "var(--canopy-ds-color-surface-surface-level-1)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-md)",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "var(--canopy-ds-spacing-xs)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "var(--canopy-ds-spacing-xs) var(--canopy-ds-spacing-sm)",
  background: "var(--canopy-ds-color-surface-surface-level-2)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  font: "inherit",
  outline: "none",
};

const joinButtonStyle: React.CSSProperties = {
  appearance: "none",
  padding: "var(--canopy-ds-spacing-xs) var(--canopy-ds-spacing-md)",
  background: "var(--canopy-ds-color-action-action-default, transparent)",
  color: "var(--canopy-ds-color-text-icon-text-default)",
  border: "1px solid var(--canopy-ds-color-border-border-default)",
  borderRadius: "var(--canopy-ds-radius-sm)",
  cursor: "pointer",
  font: "inherit",
};

function navigateToRoom(id: string, mode: "new" | "join"): void {
  const params = new URLSearchParams();
  params.set("room", id);
  params.set(mode, "1");
  window.location.assign(`${window.location.pathname}?${params.toString()}`);
}

export function LandingPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleNewDraft = () => {
    navigateToRoom(generateRoomId(), "new");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeRoomId(code);
    if (!id) {
      setError("Enter a code like quiet-tiger-42 or paste a draft link.");
      return;
    }
    navigateToRoom(id, "join");
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--canopy-ds-spacing-2xs)" }}>
          <Heading
            level={1}
            variant="display-01"
            style={{ color: "var(--canopy-ds-color-text-icon-text-default)", margin: 0 }}
          >
            Mana Table
          </Heading>
          <Text
            variant="body-01"
            as="p"
            style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)", margin: 0 }}
          >
            Multiplayer MTG draft and play.
          </Text>
        </div>

        <GlassButton
          size="lg"
          onClick={handleNewDraft}
          aria-label="Create a new draft"
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--canopy-ds-spacing-xs)",
              color: "var(--canopy-ds-color-text-icon-text-default)",
            }}
          >
            <Icon name="plus" size="sm" />
            <Text variant="headline-02" as="span">New Draft</Text>
          </span>
        </GlassButton>

        <form style={joinPanelStyle} onSubmit={handleJoin}>
          <label htmlFor="join-code">
            <Text
              variant="caption-01"
              as="span"
              style={{ color: "var(--canopy-ds-color-text-icon-text-subtle)" }}
            >
              Have a code? Join an existing draft.
            </Text>
          </label>
          <div style={inputRowStyle}>
            <input
              id="join-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="quiet-tiger-42"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Draft code"
              style={inputStyle}
            />
            <button type="submit" style={joinButtonStyle} aria-label="Join draft">
              Join
            </button>
          </div>
          {error && (
            <Text
              variant="caption-01"
              as="p"
              role="alert"
              style={{
                color: "var(--canopy-ds-color-text-icon-text-danger, var(--canopy-ds-color-text-icon-text-subtle))",
                margin: 0,
              }}
            >
              {error}
            </Text>
          )}
        </form>
      </div>
    </div>
  );
}
