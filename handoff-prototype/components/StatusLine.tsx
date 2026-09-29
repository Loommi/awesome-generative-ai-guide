"use client";

import { useEffect, useState } from "react";

/** A dot plus a short phrase. The phrase fades after a while once things are fine. */
export function StatusLine({ tone, text, fadeWhenOk = true }: { tone: "ok" | "wait" | "bad"; text: string; fadeWhenOk?: boolean }) {
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    setQuiet(false);
    if (tone !== "ok" || !fadeWhenOk) return;
    const t = setTimeout(() => setQuiet(true), 2600);
    return () => clearTimeout(t);
  }, [tone, text, fadeWhenOk]);
  return (
    <div className="status" data-tone={tone} data-quiet={quiet}>
      <span className="status-dot" />
      <span className="status-text">{text}</span>
    </div>
  );
}
