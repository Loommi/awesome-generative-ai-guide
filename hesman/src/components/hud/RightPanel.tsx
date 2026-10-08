"use client";

import { useHesmanStore } from "@/state/store";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { simPowerOutput, simStructuralIntegrity } from "@/lib/telemetry";

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-sm bg-slate-800/70">
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  );
}

export function RightPanel() {
  const selected = useHesmanStore((s) => s.selectedUnit);
  const mode = useHesmanStore((s) => s.mode);
  const transformedUnits = useHesmanStore((s) => s.transformedUnits);
  const logLines = useHesmanStore((s) => s.logLines);

  const combined = mode === "combined" || mode === "exploded";
  const id = selected ?? "black";
  const cfg = LION_CONFIGS[id];
  const integrity = simStructuralIntegrity(id, combined);
  const power = simPowerOutput(id, transformedUnits[id]);
  const assembledCount = LION_ORDER.filter((lid) => transformedUnits[lid]).length;

  const connection =
    mode === "combined" || mode === "exploded"
      ? "LINKED"
      : mode === "transforming" || mode === "exploding" || mode === "reassembling"
        ? "IN TRANSIT"
        : "DOCKED";

  return (
    <div className="pointer-events-auto flex w-72 flex-col gap-3 border-l border-cyan-500/15 bg-[#030509]/75 p-3 backdrop-blur-md">
      <div className="font-mono text-[10px] tracking-[0.25em] text-cyan-400/80">TELEMETRY</div>

      {selected ? (
        <div className="space-y-3 rounded-sm border border-slate-700/50 bg-black/30 p-3">
          <div>
            <div className="font-mono text-[12px] font-semibold text-slate-100">{cfg.name}</div>
            <div className="font-mono text-[9px] tracking-widest text-slate-500">{cfg.codename}</div>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-slate-400">{cfg.description}</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-[9px] tracking-widest text-slate-500">
            <div>
              CONFIGURATION
              <div className="text-slate-200">{cfg.robotPart.toUpperCase()}</div>
            </div>
            <div>
              CONNECTION
              <div className={connection === "DOCKED" ? "text-emerald-400" : "text-cyan-300"}>
                {connection}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-widest text-slate-500">
              <span>STRUCTURAL INTEGRITY (SIM)</span>
              <span className="text-slate-300">{integrity}%</span>
            </div>
            <Bar value={integrity} color={cfg.colorAccent} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-widest text-slate-500">
              <span>POWER CORE OUTPUT (SIM)</span>
              <span className="text-slate-300">{power}%</span>
            </div>
            <Bar value={power} color="#f59e0b" />
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-slate-700/50 bg-black/30 p-3 font-mono text-[10px] text-slate-500">
          No unit selected. Click a lion in the viewport or the unit list.
        </div>
      )}

      <div className="rounded-sm border border-slate-700/50 bg-black/30 p-3">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] tracking-widest text-slate-500">
          <span>ASSEMBLY PROGRESSION</span>
          <span className="text-slate-300">{assembledCount}/5</span>
        </div>
        <Bar value={(assembledCount / 5) * 100} color="#22d3ee" />
      </div>

      <div className="flex-1 overflow-hidden rounded-sm border border-slate-700/50 bg-black/40 p-3">
        <div className="mb-1.5 font-mono text-[9px] tracking-widest text-slate-500">SYSTEM LOG</div>
        <div className="flex flex-col gap-1 font-mono text-[9px] leading-relaxed text-emerald-400/80">
          {logLines.map((line, i) => (
            <div key={i} className="truncate">
              &gt; {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
