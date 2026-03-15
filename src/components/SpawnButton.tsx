import { GlassButton, Icon, Text } from "@canopy-ds/react";
import type { Editor } from "tldraw";
import { useSpawnCard } from "../hooks/useSpawnCard";

type Props = {
  editor: Editor | null;
};

export function SpawnButton({ editor }: Props) {
  const spawnCard = useSpawnCard(editor);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--canopy-ds-spacing-lg)",
        left: "var(--canopy-ds-spacing-lg)",
        zIndex: 500, // above tldraw toolbar (~300) but below debug overlay
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="lg"
        aria-label="Spawn random MTG card"
        onClick={spawnCard}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--canopy-ds-spacing-xs)", color: "var(--canopy-ds-color-text-icon-text-default)" }}>
          <Icon name="plus" size="sm" />
          <Text variant="headline-02" as="span">Spawn Card</Text>
        </span>
      </GlassButton>
    </div>
  );
}
