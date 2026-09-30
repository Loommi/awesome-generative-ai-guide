"use client";

import { MISSION } from "@/lib/mission/content";
import { Decode } from "../fx/Decode";

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
            <p className="mh-program">
              <Decode text={MISSION.program} duration={500} />
            </p>
            <h1 className="mh-title">
              <Decode text={MISSION.tabletTitle} delay={150} />
            </h1>
            <p className="mh-sub">
              <Decode text={MISSION.tabletSubtitle} delay={350} />
            </p>
          </>
        ) : (
          <>
            <h1 className="mh-title">
              <Decode text={MISSION.wallTitle} duration={900} />
            </h1>
            <p className="mh-sub">
              <Decode text={MISSION.wallSubtitle} delay={300} />
            </p>
          </>
        )}
      </div>
      <ul className="mh-indicators">
        {indicators.map((ind, i) => (
          <li key={ind.label} data-tone={ind.tone} style={{ animationDelay: `${500 + i * 160}ms` }}>
            <i aria-hidden />
            {ind.label}
          </li>
        ))}
        {room && <li className="mh-room">ROOM {room}</li>}
      </ul>
      <div className="mh-rule" aria-hidden />
    </header>
  );
}
