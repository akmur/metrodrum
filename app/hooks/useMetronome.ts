import { useState, useCallback, useRef, useEffect } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";

export type Subdivision = 3 | 4 | 6;
export type SoundPreset = "click" | "beep" | "tick";

interface MetronomeState {
  bpm: number;
  subdivision: Subdivision;
  isPlaying: boolean;
  currentBeat: number;
  soundPreset: SoundPreset;
  setBpm: (bpm: number) => void;
  setSubdivision: (sub: Subdivision) => void;
  setSoundPreset: (preset: SoundPreset) => void;
  toggle: () => Promise<void>;
  stop: () => void;
  tapTempo: () => void;
}

const createSynthForPreset = (preset: SoundPreset): Tone.Synth => {
  switch (preset) {
    case "click":
      // Triangle wave - classic metronome click
      return new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      }).toDestination();
    
    case "beep":
      // Sine wave - melodic beep
      return new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
      }).toDestination();
    
    case "tick":
      // Filtered noise - mechanical tick
      return new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination();
  }
};

export function useMetronome(): MetronomeState {
  const { isAudioStarted, startAudio } = useAudio();
  const [bpm, setBpmState] = useState(90);
  const [subdivision, setSubdivisionState] = useState<Subdivision>(4);
  const [soundPreset, setSoundPresetState] = useState<SoundPreset>("click");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const synthRef = useRef<Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      loopRef.current?.dispose();
      synthRef.current?.dispose();
      if (Tone.getTransport().state === "started") {
        Tone.getTransport().stop();
      }
    };
  }, []);

  const setBpm = useCallback((value: number) => {
    const clamped = Math.min(240, Math.max(40, value));
    setBpmState(clamped);
    Tone.getTransport().bpm.value = clamped;
  }, []);

  const stop = useCallback(() => {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    loopRef.current?.dispose();
    loopRef.current = null;
    synthRef.current?.dispose();
    synthRef.current = null;
    beatRef.current = 0;
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const setSubdivision = useCallback((sub: Subdivision) => {
    if (isPlaying) {
      stop();
    }
    setSubdivisionState(sub);
  }, [isPlaying, stop]);

  const setSoundPreset = useCallback((preset: SoundPreset) => {
    if (isPlaying) {
      stop();
    }
    setSoundPresetState(preset);
  }, [isPlaying, stop]);

  const startMetronome = useCallback(() => {
    const transport = Tone.getTransport();

    loopRef.current?.dispose();
    synthRef.current?.dispose();

    const synth = createSynthForPreset(soundPreset);
    synthRef.current = synth;

    transport.bpm.value = bpm;
    beatRef.current = 0;

    // Always loop on quarter notes (4n), subdivision just determines accent pattern
    const loop = new Tone.Loop((time) => {
      const beat = beatRef.current;
      const isAccent = beat === 0;
      synth.triggerAttackRelease(isAccent ? "C5" : "G4", "32n", time);
      Tone.getDraw().schedule(() => {
        setCurrentBeat(beat);
      }, time);
      beatRef.current = (beat + 1) % subdivision;
    }, "4n"); // Always quarter note interval

    loop.start(0);
    loopRef.current = loop;
    transport.start();
    setIsPlaying(true);
  }, [bpm, subdivision, soundPreset]);

  const toggle = useCallback(async () => {
    if (!isAudioStarted) {
      await startAudio();
    }
    if (isPlaying) {
      stop();
    } else {
      startMetronome();
    }
  }, [isAudioStarted, startAudio, isPlaying, stop, startMetronome]);

  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    
    // Reset if last tap was more than 2 seconds ago
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    
    taps.push(now);
    
    // Keep only last 8 taps
    if (taps.length > 8) {
      taps.shift();
    }
    
    // Need at least 2 taps to calculate BPM
    if (taps.length >= 2) {
      // Calculate average interval between taps
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // Convert to BPM: 60000ms per minute / interval in ms
      const calculatedBpm = Math.round(60000 / avgInterval);
      setBpm(calculatedBpm);
    }
  }, [setBpm]);

  return {
    bpm,
    subdivision,
    soundPreset,
    isPlaying,
    currentBeat,
    setBpm,
    setSubdivision,
    setSoundPreset,
    toggle,
    stop,
    tapTempo,
  };
}
