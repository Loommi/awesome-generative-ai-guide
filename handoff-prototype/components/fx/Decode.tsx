"use client";

import { useEffect, useState } from "react";

const GLYPHS = "▮▯░▒<>/\\|_-=+*#01ABCDEFXZ";

/**
 * Text that resolves out of scrambled glyphs, left to right. Renders the final
 * text on the server and under reduced motion, so nothing depends on it.
 */
export function Decode({ text, delay = 0, duration = 700 }: { text: string; delay?: number; duration?: number }) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Each character settles at its own moment: roughly left to right, with jitter.
    const settle = Array.from(text, (_, i) => (i / Math.max(1, text.length)) * 0.75 + ((i * 37) % 11) / 44);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = (now - start) / duration;
      if (p >= 1) {
        setShown(text);
        return;
      }
      setShown(
        Array.from(text, (ch, i) => (ch === " " || (p > 0 && p >= settle[i]) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, duration]);

  return (
    <span className="decode" aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
