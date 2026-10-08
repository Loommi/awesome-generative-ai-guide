"use client";

import { useState } from "react";
import {
  Camera,
  FastForward,
  Layers,
  RotateCcw,
  Unlink,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
} from "lucide-react";
import { useHesmanStore } from "@/state/store";
import {
  playDisassembleTimeline,
  playExplodeTimeline,
  playFullCombinationTimeline,
  playReassembleTimeline,
  resetSceneInstant,
  transformSingleLion,
} from "@/three/timelines";
import { skipCurrentTimeline } from "@/three/timelineControl";
import { applyCameraPreset } from "@/three/cameraPresets";
import { CameraPresetId } from "@/lib/types";
import { playUiSound } from "@/audio/sound";

const PRESETS: { id: CameraPresetId; label: string }[] = [
  { id: "hero", label: "HERO VIEW" },
  { id: "front", label: "FRONT" },
  { id: "back", label: "BACK" },
  { id: "left", label: "LEFT" },
  { id: "right", label: "RIGHT" },
  { id: "top", label: "TOP" },
  { id: "bottom", label: "BOTTOM" },
  { id: "reset", label: "RESET" },
];

function ActionButton({
  onClick,
  disabled,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[10px] font-semibold tracking-widest transition-colors ${
        disabled
          ? "cursor-not-allowed border-slate-800 text-slate-600"
          : active
            ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-200"
            : "border-slate-600/60 text-slate-300 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-200"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function BottomBar() {
  const mode = useHesmanStore((s) => s.mode);
  const busy = useHesmanStore((s) => s.busy);
  const selected = useHesmanStore((s) => s.selectedUnit);
  const transformedUnits = useHesmanStore((s) => s.transformedUnits);
  const audioEnabled = useHesmanStore((s) => s.audioEnabled);
  const toggleAudio = useHesmanStore((s) => s.toggleAudio);
  const [camOpen, setCamOpen] = useState(false);

  const canTransform = mode === "beast" && !!selected && !busy;
  const canCombine = mode === "beast" && !busy;
  const canExplode = mode === "combined" && !busy;
  const canReassemble = mode === "exploded" && !busy;
  const canDisassemble = mode === "combined" && !busy;
  const focus: [number, number, number] =
    mode === "combined" || mode === "exploded" ? [0, 1.8, 0] : [0, 1, 0];
  const dist = mode === "combined" || mode === "exploded" ? 10 : 16;

  return (
    <div className="pointer-events-auto relative flex flex-wrap items-center justify-center gap-2 border-t border-cyan-500/20 bg-[#030509]/85 px-3 py-3 backdrop-blur-md sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          onClick={() => {
            if (!selected) return;
            playUiSound(audioEnabled, "confirm");
            transformSingleLion(selected, !transformedUnits[selected]);
          }}
          disabled={!canTransform}
          icon={<Zap size={13} />}
          label={selected && transformedUnits[selected] ? "REVERT" : "TRANSFORM"}
        />
        <ActionButton
          onClick={() => {
            playUiSound(audioEnabled, "combine");
            playFullCombinationTimeline();
          }}
          disabled={!canCombine}
          active={mode === "transforming"}
          icon={<Sparkles size={13} />}
          label="INITIATE COMBINATION"
        />
        <ActionButton
          onClick={() => {
            playUiSound(audioEnabled, "confirm");
            if (mode === "exploded") playReassembleTimeline();
            else playExplodeTimeline();
          }}
          disabled={!canExplode && !canReassemble}
          active={mode === "exploded"}
          icon={<Layers size={13} />}
          label={mode === "exploded" ? "REASSEMBLE" : "EXPLODED VIEW"}
        />
        <ActionButton
          onClick={() => {
            playUiSound(audioEnabled, "warn");
            playDisassembleTimeline();
          }}
          disabled={!canDisassemble}
          icon={<Unlink size={13} />}
          label="DISASSEMBLE"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <ActionButton
            onClick={() => setCamOpen((v) => !v)}
            icon={<Camera size={13} />}
            label="CAMERA"
            active={camOpen}
          />
          {camOpen && (
            <div className="absolute bottom-full right-0 mb-2 grid w-40 grid-cols-2 gap-1 rounded-sm border border-cyan-500/30 bg-[#030509]/95 p-2 backdrop-blur-md">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    applyCameraPreset(p.id, focus, dist);
                    setCamOpen(false);
                  }}
                  className="rounded-sm border border-slate-700/60 px-1.5 py-1.5 font-mono text-[9px] tracking-wider text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <ActionButton
          onClick={() => {
            skipCurrentTimeline();
          }}
          disabled={!busy}
          icon={<FastForward size={13} />}
          label="SKIP"
        />
        <ActionButton
          onClick={() => resetSceneInstant()}
          icon={<RotateCcw size={13} />}
          label="RESET SCENE"
        />
        <ActionButton
          onClick={toggleAudio}
          icon={audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          label={audioEnabled ? "AUDIO ON" : "AUDIO OFF"}
          active={audioEnabled}
        />
      </div>
    </div>
  );
}
