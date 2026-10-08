let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

type SoundKind = "confirm" | "combine" | "warn" | "select" | "whoosh";

const PRESETS: Record<SoundKind, { freq: number; freq2?: number; type: OscillatorType; duration: number; gain: number }> = {
  select: { freq: 660, freq2: 880, type: "sine", duration: 0.09, gain: 0.08 },
  confirm: { freq: 420, freq2: 640, type: "triangle", duration: 0.16, gain: 0.1 },
  combine: { freq: 180, freq2: 60, type: "sawtooth", duration: 0.9, gain: 0.12 },
  warn: { freq: 320, freq2: 180, type: "square", duration: 0.3, gain: 0.08 },
  whoosh: { freq: 900, freq2: 140, type: "sine", duration: 0.5, gain: 0.07 },
};

export function playUiSound(enabled: boolean, kind: SoundKind) {
  if (!enabled) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const preset = PRESETS[kind];
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = preset.type;
  osc.frequency.setValueAtTime(preset.freq, now);
  if (preset.freq2) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(preset.freq2, 1), now + preset.duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(preset.gain, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + preset.duration + 0.05);
}
