import { useState, useCallback, useRef, useEffect } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";

export type Beats = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
export type NoteValue = 2 | 4 | 8;
export type SoundPreset = "click" | "beep" | "tick" | "sticks";

interface MetronomeState {
  bpm: number;
  beats: Beats;
  noteValue: NoteValue;
  isPlaying: boolean;
  currentBeat: number;
  soundPreset: SoundPreset;
  accentEnabled: boolean;
  setBpm: (bpm: number) => void;
  setBeats: (beats: Beats) => void;
  setNoteValue: (noteValue: NoteValue) => void;
  setSoundPreset: (preset: SoundPreset) => void;
  setAccentEnabled: (enabled: boolean) => void;
  toggle: () => Promise<void>;
  stop: () => void;
  tapTempo: () => void;
}

const createSynthForPreset = (preset: SoundPreset): Tone.Synth | Tone.MembraneSynth => {
  switch (preset) {
    case "click":
      return new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      }).toDestination();

    case "beep":
      return new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
      }).toDestination();

    case "tick":
      return new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination();

    case "sticks":
      return new Tone.MembraneSynth({
        pitchDecay: 0.006,
        octaves: 3,
        envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.04 },
      }).toDestination();
  }
};

export function useMetronome(): MetronomeState {
  const { isAudioStarted, startAudio } = useAudio();
  const [bpm, setBpmState] = useState(90);
  const [beats, setBeatsState] = useState<Beats>(4);
  const [noteValue, setNoteValueState] = useState<NoteValue>(4);
  const [soundPreset, setSoundPresetState] = useState<SoundPreset>("click");
  const [accentEnabled, setAccentEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const synthRef = useRef<Tone.Synth | Tone.MembraneSynth | null>(null);
  const accentSynthRef = useRef<Tone.MembraneSynth | null>(null); // sticks only
  const accentEnabledRef = useRef(true);
  const loopRef = useRef<Tone.Loop | null>(null);
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      loopRef.current?.dispose();
      synthRef.current?.dispose();
      accentSynthRef.current?.dispose();
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
    accentSynthRef.current?.dispose();
    accentSynthRef.current = null;
    beatRef.current = 0;
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const setBeats = useCallback((b: Beats) => {
    if (isPlaying) stop();
    setBeatsState(b);
  }, [isPlaying, stop]);

  const setNoteValue = useCallback((nv: NoteValue) => {
    if (isPlaying) stop();
    setNoteValueState(nv);
  }, [isPlaying, stop]);

  const setSoundPreset = useCallback((preset: SoundPreset) => {
    if (isPlaying) stop();
    setSoundPresetState(preset);
  }, [isPlaying, stop]);

  const handleSetAccentEnabled = useCallback((enabled: boolean) => {
    accentEnabledRef.current = enabled;
    setAccentEnabled(enabled);
  }, []);

  const startMetronome = useCallback(() => {
    const transport = Tone.getTransport();

    loopRef.current?.dispose();
    synthRef.current?.dispose();
    accentSynthRef.current?.dispose();
    accentSynthRef.current = null;

    // For sticks: two dedicated synths so accent and normal beats never share
    // oscillator/envelope state. Each synth handles only its own role, always
    // starting from a clean state at any reasonable BPM.
    const normalSynth = createSynthForPreset(soundPreset);
    synthRef.current = normalSynth;

    let accentSynth: Tone.Synth | Tone.MembraneSynth = normalSynth;
    if (soundPreset === "sticks") {
      accentSynth = createSynthForPreset("sticks");
      accentSynthRef.current = accentSynth as Tone.MembraneSynth;
    }

    transport.bpm.value = bpm;
    beatRef.current = 0;

    const [accentNote, normalNote] = soundPreset === "sticks" ? ["E5", "A5"] : ["C5", "G4"];
    const loop = new Tone.Loop((time) => {
      const beat = beatRef.current;
      const isAccent = beat === 0 && accentEnabledRef.current;
      const synth = isAccent ? accentSynth : normalSynth;
      synth.triggerAttackRelease(isAccent ? accentNote : normalNote, "32n", time);
      Tone.getDraw().schedule(() => {
        setCurrentBeat(beat);
      }, time);
      beatRef.current = (beat + 1) % beats;
    }, `${noteValue}n`);

    loop.start(0);
    loopRef.current = loop;
    transport.start();
    setIsPlaying(true);
  }, [bpm, beats, noteValue, soundPreset]);

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
    beats,
    noteValue,
    soundPreset,
    accentEnabled,
    isPlaying,
    currentBeat,
    setBpm,
    setBeats,
    setNoteValue,
    setSoundPreset,
    setAccentEnabled: handleSetAccentEnabled,
    toggle,
    stop,
    tapTempo,
  };
}
