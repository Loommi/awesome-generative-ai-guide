"use client";

import { useHesmanStore } from "@/state/store";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { focusUnit } from "@/three/cameraPresets";
import { playUiSound } from "@/audio/sound";

export function LeftPanel() {
  const selected = useHesmanStore((s) => s.selectedUnit);
  const selectUnit = useHesmanStore((s) => s.selectUnit);
  const transformedUnits = useHesmanStore((s) => s.transformedUnits);
  const mode = useHesmanStore((s) => s.mode);
  const audioEnabled = useHesmanStore((s) => s.audioEnabled);

  return (
    <div className="pointer-events-auto flex w-60 flex-col gap-2 border-r border-cyan-500/15 bg-[#030509]/75 p-3 backdrop-blur-md">
      <div className="mb-1 font-mono text-[10px] tracking-[0.25em] text-cyan-400/80">
        UNIT CONTROL
      </div>
      {LION_ORDER.map((id) => {
        const cfg = LION_CONFIGS[id];
        const isSelected = selected === id;
        const isTransformed = transformedUnits[id];
        return (
          <button
            key={id}
            onClick={() => {
              selectUnit(id);
              playUiSound(audioEnabled, "select");
              if (mode === "beast") focusUnit(id);
            }}
            className={`group relative flex items-center gap-2.5 overflow-hidden rounded-sm border px-2.5 py-2 text-left transition-colors ${
              isSelected
                ? "border-cyan-400/70 bg-cyan-400/10"
                : "border-slate-700/50 bg-black/30 hover:border-cyan-400/40 hover:bg-cyan-400/5"
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: cfg.colorPrimary, boxShadow: `0 0 8px ${cfg.colorAccent}` }}
            />
            <span className="min-w-0 flex-1">
              <div className="truncate font-mono text-[11px] font-semibold tracking-wide text-slate-100">
                {cfg.name}
              </div>
              <div className="truncate font-mono text-[9px] tracking-widest text-slate-500">
                {cfg.codename}
              </div>
            </span>
            <span
              className={`shrink-0 font-mono text-[8px] tracking-widest ${
                isTransformed ? "text-amber-400" : "text-slate-600"
              }`}
            >
              {isTransformed ? "ROBOT" : "BEAST"}
            </span>
            {isSelected && (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
