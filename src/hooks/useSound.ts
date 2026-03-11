import { useCallback, useRef } from "react";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

type SoundName = "click" | "favorite" | "unfavorite" | "spin" | "result" | "themeSwitch" | "delete" | "add";

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  detune = 0,
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChord(notes: { freq: number; delay: number; dur: number; type?: OscillatorType; vol?: number }[]) {
  const ctx = getAudioContext();
  for (const n of notes) {
    setTimeout(() => {
      playTone(n.freq, n.dur, n.type || "sine", n.vol || 0.12);
    }, n.delay * 1000);
    void ctx; // keep reference
  }
}

const soundMap: Record<SoundName, () => void> = {
  click: () => {
    playTone(800, 0.08, "sine", 0.08);
  },
  favorite: () => {
    playChord([
      { freq: 523, delay: 0, dur: 0.15, vol: 0.15 },     // C5
      { freq: 659, delay: 0.08, dur: 0.15, vol: 0.15 },   // E5
      { freq: 784, delay: 0.16, dur: 0.25, vol: 0.12 },   // G5
    ]);
  },
  unfavorite: () => {
    playTone(440, 0.15, "sine", 0.08);
  },
  spin: () => {
    playChord([
      { freq: 400, delay: 0, dur: 0.1, type: "triangle", vol: 0.1 },
      { freq: 500, delay: 0.08, dur: 0.1, type: "triangle", vol: 0.1 },
      { freq: 600, delay: 0.16, dur: 0.1, type: "triangle", vol: 0.1 },
    ]);
  },
  result: () => {
    playChord([
      { freq: 523, delay: 0, dur: 0.2, vol: 0.15 },       // C5
      { freq: 659, delay: 0.1, dur: 0.2, vol: 0.15 },     // E5
      { freq: 784, delay: 0.2, dur: 0.2, vol: 0.15 },     // G5
      { freq: 1047, delay: 0.3, dur: 0.4, vol: 0.12 },    // C6
    ]);
  },
  themeSwitch: () => {
    playChord([
      { freq: 600, delay: 0, dur: 0.12, type: "triangle", vol: 0.1 },
      { freq: 800, delay: 0.1, dur: 0.15, type: "triangle", vol: 0.08 },
    ]);
  },
  delete: () => {
    playTone(300, 0.2, "sawtooth", 0.06);
  },
  add: () => {
    playChord([
      { freq: 440, delay: 0, dur: 0.12, vol: 0.12 },
      { freq: 554, delay: 0.06, dur: 0.12, vol: 0.12 },
      { freq: 659, delay: 0.12, dur: 0.2, vol: 0.1 },
    ]);
  },
};

export function useSound() {
  const enabledRef = useRef(true);

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current) return;
    try {
      soundMap[name]();
    } catch {
      // Silently ignore audio context errors
    }
  }, []);

  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  return { play, toggle, isEnabled };
}
