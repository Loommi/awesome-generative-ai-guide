"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Controller without a room: type the code shown on the display. */
export function JoinForm({ debug }: { debug: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <main className="stage stage-join">
      <form
        className="join"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code) return;
          router.push(`/controller?room=${code}${debug ? "&debug=true" : ""}`);
        }}
      >
        <label htmlFor="room">Room code on the display</label>
        <input
          id="room"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="A7KF"
          autoFocus
        />
        <button type="submit" className="ghost-button" disabled={code.length < 3}>
          Join
        </button>
      </form>
    </main>
  );
}
