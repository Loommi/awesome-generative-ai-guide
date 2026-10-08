import { create } from "zustand";
import { AppMode, CameraPresetId, LionId } from "@/lib/types";

interface HesmanState {
  mode: AppMode;
  selectedUnit: LionId | null;
  transformedUnits: Record<LionId, boolean>;
  cameraPreset: CameraPresetId;
  audioEnabled: boolean;
  reducedMotion: boolean;
  skipToken: number;
  busy: boolean;
  logLines: string[];

  selectUnit: (id: LionId | null) => void;
  setMode: (mode: AppMode) => void;
  setCameraPreset: (preset: CameraPresetId) => void;
  toggleAudio: () => void;
  setReducedMotion: (v: boolean) => void;
  requestSkip: () => void;
  setTransformed: (id: LionId, v: boolean) => void;
  setBusy: (v: boolean) => void;
  log: (line: string) => void;
}

export const useHesmanStore = create<HesmanState>((set) => ({
  mode: "intro",
  selectedUnit: null,
  transformedUnits: {
    black: false,
    red: false,
    green: false,
    blue: false,
    orange: false,
  },
  cameraPreset: "hero",
  audioEnabled: false,
  reducedMotion:
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
      : false,
  skipToken: 0,
  busy: false,
  logLines: ["SYSTEM BOOT // HESMAN ASSEMBLY CONTROL ONLINE"],

  selectUnit: (id) => set({ selectedUnit: id }),
  setMode: (mode) => set({ mode }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  requestSkip: () => set((s) => ({ skipToken: s.skipToken + 1 })),
  setTransformed: (id, v) =>
    set((s) => ({ transformedUnits: { ...s.transformedUnits, [id]: v } })),
  setBusy: (v) => set({ busy: v }),
  log: (line) =>
    set((s) => ({ logLines: [...s.logLines.slice(-7), line] })),
}));
