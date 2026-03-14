import { GlassButton } from "@canopy-ds/react";
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
        bottom: 24,
        left: 24,
        zIndex: 500, // above tldraw toolbar (~300) but below debug overlay
        pointerEvents: "all",
      }}
    >
      <GlassButton
        size="lg"
        aria-label="Spawn random MTG card"
        onClick={spawnCard}
      >
        + Spawn Card
      </GlassButton>
    </div>
  );
}
