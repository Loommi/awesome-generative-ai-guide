"use client";

import { MISSION } from "@/lib/mission/content";

export interface Indicator {
  label: string;
  tone: "ok" | "wait" | "bad";
}

/** Top bar for both screens. Big, restrained type so it reads across a room. */
export function MissionHeader({ role, indicators, room }: { role: "controller" | "display"; indicators: Indicator[]; room?: string }) {
  return (
    <header className={`mission-header mission-header-${role}`}>
      <div className="mh-id">
        {role === "controller" ? (
          <>
            <p className="mh-program">{MISSION.program}</p>
            <h1 className="mh-title">{MISSION.tabletTitle}</h1>
            <p className="mh-sub">{MISSION.tabletSubtitle}</p>
          </>
        ) : (
          <>
            <h1 className="mh-title">{MISSION.wallTitle}</h1>
            <p className="mh-sub">{MISSION.wallSubtitle}</p>
          </>
        )}
      </div>
      <ul className="mh-indicators">
        {indicators.map((ind) => (
          <li key={ind.label} data-tone={ind.tone}>
            <i aria-hidden />
            {ind.label}
          </li>
        ))}
        {room && <li className="mh-room">ROOM {room}</li>}
      </ul>
    </header>
  );
}
