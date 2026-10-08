"use client";

import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { BottomBar } from "./BottomBar";

export function HudRoot() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <div className="hidden sm:block">
          <LeftPanel />
        </div>
        <div className="flex-1" />
        <div className="hidden lg:block">
          <RightPanel />
        </div>
      </div>
      <BottomBar />
    </div>
  );
}
