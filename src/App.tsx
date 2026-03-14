import { useMemo } from "react";
import { IconSprite } from "@canopy-ds/react";
import { RoomProvider } from "./liveblocks.config";
import { MtgCanvas } from "./components/MtgCanvas";
import type { Presence } from "./liveblocks.config";

function generatePresence(): Presence {
  const id = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  const hex = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;
  return {
    cursor: null,
    color: hex,
    username: `Planeswalker #${id}`,
  };
}

export default function App() {
  // Generate once on mount — stable across re-renders
  const initialPresence = useMemo(() => generatePresence(), []);

  return (
    <>
      {/* IconSprite must be mounted once before any <Icon> renders — per iconography.md */}
      <IconSprite />
      <RoomProvider
        id="mana-table-room-1"
        initialPresence={initialPresence}
        initialStorage={{}}
      >
        <MtgCanvas />
      </RoomProvider>
    </>
  );
}
