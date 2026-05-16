import { useEffect } from "react";
import {
  useMyPresence,
  useStorage,
  useUpdateMyPresence,
} from "../liveblocks.config";
import { MtgCanvas } from "../components/MtgCanvas";
import { Lobby } from "./Lobby";

export function AppShell() {
  const [myPresence] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();
  const draftState = useStorage((root) => root.draft?.state ?? "idle");

  // Room-level "playing" state routes everyone to the canvas. Each client
  // flips its own Presence.screen; AppShell only ever reads its own.
  useEffect(() => {
    if (draftState === "playing" && myPresence.screen === "lobby") {
      updateMyPresence({ screen: "canvas" });
    }
  }, [draftState, myPresence.screen, updateMyPresence]);

  if (myPresence.screen === "canvas") {
    return <MtgCanvas />;
  }

  return <Lobby />;
}
