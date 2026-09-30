// No 0/O or 1/I so codes can be read off a TV and typed on a tablet.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

export function normalizeRoom(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const room = (raw ?? "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
  return room || null;
}
