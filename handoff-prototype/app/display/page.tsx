import { redirect } from "next/navigation";
import { DisplayView } from "@/components/DisplayView";
import { createRoomCode, normalizeRoom } from "@/lib/handoff/room";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function DisplayPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const room = normalizeRoom(sp.room);
  const debug = sp.debug === "true";
  if (!room) {
    // The display owns pairing: mint a short room code and put it in the URL.
    const qs = new URLSearchParams({ room: createRoomCode() });
    if (debug) qs.set("debug", "true");
    if (typeof sp.transport === "string") qs.set("transport", sp.transport);
    redirect(`/display?${qs}`);
  }
  return <DisplayView room={room} debug={debug} prefer={sp.transport === "local" ? "broadcast" : undefined} />;
}
