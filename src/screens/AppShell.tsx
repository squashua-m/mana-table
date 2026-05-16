import { useEffect } from "react";
import {
  useMyPresence,
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "../liveblocks.config";
import { MtgCanvas } from "../components/MtgCanvas";
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

  // Playing → route everyone to the canvas. Triggered after the final pick
  // (wired in a later slice).
  useEffect(() => {
    if (draftState === "playing" && myPresence.screen !== "canvas") {
      updateMyPresence({ screen: "canvas" });
    }
  }, [draftState, myPresence.screen, updateMyPresence]);

  if (myPresence.screen === "canvas") return <MtgCanvas />;
  if (myPresence.screen === "draft") return <DraftRoom />;
  return <Lobby />;
}
