import { useEffect } from "react";
import {
  useMyPresence,
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "../liveblocks.config";
import { MtgCanvas } from "../components/MtgCanvas";
import { DeckBuilder } from "./DeckBuilder";
import { DraftRoom } from "./DraftRoom";
import { Lobby } from "./Lobby";

export function AppShell() {
  const [myPresence] = useMyPresence();
  const updateMyPresence = useUpdateMyPresence();
  const self = useSelf();
  const myId = self?.connectionId ?? null;
  const draftState = useStorage((root) => root.draft?.state ?? "idle");
  const drafters = useStorage((root) => root.draft?.drafters ?? null);

  // Drafting → route drafters to the DraftRoom. Each client checks whether
  // it's in the drafters list and flips its own screen accordingly.
  useEffect(() => {
    if (draftState !== "drafting") return;
    if (myPresence.screen !== "lobby") return;
    if (myId === null || !drafters) return;
    if (drafters.includes(myId)) {
      updateMyPresence({ screen: "draft" });
    }
  }, [draftState, drafters, myId, myPresence.screen, updateMyPresence]);

  // Playing → spectators (still in the lobby) go straight to the canvas.
  // Drafters route themselves from draft → deck-build → canvas explicitly.
  useEffect(() => {
    if (draftState === "playing" && myPresence.screen === "lobby") {
      updateMyPresence({ screen: "canvas" });
    }
  }, [draftState, myPresence.screen, updateMyPresence]);

  if (myPresence.screen === "canvas") return <MtgCanvas />;
  if (myPresence.screen === "deck-build") return <DeckBuilder />;
  if (myPresence.screen === "draft") return <DraftRoom />;
  return <Lobby />;
}
