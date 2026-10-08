"use client";

import { useEffect, useState } from "react";
import { useHesmanStore } from "@/state/store";

const MODE_LABEL: Record<string, string> = {
  intro: "SYSTEM BOOT",
  beast: "BEAST MODE // STANDBY",
  transforming: "TRANSFORMATION IN PROGRESS",
  combined: "HESMAN // COMBINED",
  exploding: "EXPLODED VIEW // SEPARATING",
  exploded: "EXPLODED VIEW // INSPECTION",
  reassembling: "REASSEMBLING",
};

export function TopBar() {
  const mode = useHesmanStore((s) => s.mode);
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().slice(11, 19) + "Z");
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pointer-events-auto flex items-center justify-between border-b border-cyan-500/20 bg-[#030509]/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-cyan-400/50 bg-cyan-400/10">
          <div className="h-2.5 w-2.5 rotate-45 border border-cyan-300 bg-cyan-400/60" />
        </div>
        <div className="leading-tight">
          <div className="font-mono text-[13px] font-semibold tracking-[0.25em] text-slate-100">
            HESMAN
          </div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-400/80">
            MECHA ASSEMBLY SYSTEM
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-6 font-mono text-[10px] tracking-widest text-slate-400 md:flex">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span>UPLINK NOMINAL</span>
        </div>
        <div className="text-cyan-300">{MODE_LABEL[mode] ?? mode.toUpperCase()}</div>
      </div>

      <div className="font-mono text-[10px] tracking-widest text-slate-500">{time}</div>
    </div>
  );
}
