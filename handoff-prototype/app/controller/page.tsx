import { ControllerView } from "@/components/ControllerView";
import { JoinForm } from "@/components/JoinForm";
import { normalizeRoom } from "@/lib/handoff/room";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ControllerPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const room = normalizeRoom(sp.room);
  const debug = sp.debug === "true";
  if (!room) return <JoinForm debug={debug} />;
  return <ControllerView room={room} debug={debug} prefer={sp.transport === "local" ? "broadcast" : undefined} />;
}
