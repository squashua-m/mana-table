import { useMyPresence } from "../liveblocks.config";
import { MtgCanvas } from "../components/MtgCanvas";
import { Lobby } from "./Lobby";

export function AppShell() {
  const [myPresence] = useMyPresence();

  if (myPresence.screen === "canvas") {
    return <MtgCanvas />;
  }

  return <Lobby />;
}
