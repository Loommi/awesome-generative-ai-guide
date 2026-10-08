"use client";

import dynamic from "next/dynamic";
import { CanvasErrorBoundary } from "@/components/scene/CanvasErrorBoundary";
import { HudRoot } from "@/components/hud/HudRoot";

const Experience = dynamic(
  () => import("@/components/scene/Experience").then((m) => m.Experience),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#01030a] font-mono text-[11px] tracking-[0.3em] text-cyan-400/70">
        INITIALIZING HANGAR SYSTEMS...
      </div>
    ),
  },
);

export default function Home() {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#01030a]">
      <CanvasErrorBoundary>
        <Experience />
      </CanvasErrorBoundary>
      <HudRoot />
    </div>
  );
}
