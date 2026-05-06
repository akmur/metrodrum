import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { useAudio } from "@/providers/AudioProvider";
import ChordDiagram from "@/features/chords/ChordDiagram";
import { CHORDS, OPEN_STRING_MIDI } from "@/features/chords/chord-data";
import { createDrumKit, type DrumKit } from "@/features/midi/gm-sounds";
import {
  BLUES_KEYS,
  BLUES_CHORDS,
  PROGRESSION,
  DEGREE_COLORS,
  DEGREE_BADGE_COLORS,
  type BluesKey,
  type BluesDegree,
} from "./blues-data";

const ORIGINAL_BPM = 100; // matches "100BPM  Blues 12bar4.mid"

const DEGREE_LABELS: Record<BluesDegree, string> = { I7: "I7", IV7: "IV7", V7: "V7" };

export default function Blues() {
  const { isAudioStarted, startAudio } = useAudio();
  const arpeggioSynthRef = useRef<Tone.Synth | null>(null);
  const clickSynthRef = useRef<Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const drumKitRef = useRef<DrumKit | null>(null);
  const partsRef = useRef<Tone.Part[]>([]);
  const midiRef = useRef<Midi | null>(null);
  const beatRef = useRef(0);

  const [activeKey, setActiveKey] = useState<BluesKey>("E");
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [midiReady, setMidiReady] = useState(false);
  const [countIn, setCountIn] = useState<number | null>(null);
  const [currentBar, setCurrentBar] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<BluesDegree | null>(null);

  const chordMap = BLUES_CHORDS[activeKey];

  // Load MIDI file on mount
  useEffect(() => {
    let cancelled = false;
    async function loadMidi() {
      try {
        const res = await fetch(
          `/samples/midi/${encodeURIComponent("100BPM  Blues 12bar4.mid")}`
        );
        const buf = await res.arrayBuffer();
        if (!cancelled) {
          midiRef.current = new Midi(buf);
          setMidiReady(true);
        }
      } catch (e) {
        console.error("Failed to load Blues MIDI:", e);
      }
    }
    loadMidi();
    return () => { cancelled = true; };
  }, []);

  // Stop transport helper
  const stopTransport = useCallback(() => {
    loopRef.current?.stop();
    try { loopRef.current?.dispose(); } catch { /* already disposed */ }
    loopRef.current = null;

    partsRef.current.forEach(p => { try { p.stop(); p.dispose(); } catch { /* */ } });
    partsRef.current = [];

    try { clickSynthRef.current?.dispose(); } catch { /* */ }
    clickSynthRef.current = null;

    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    beatRef.current = 0;
  }, []);

  // Cleanup on unmount — also dispose drum kit
  useEffect(() => () => {
    stopTransport();
    try { drumKitRef.current?.dispose(); } catch { /* */ }
    drumKitRef.current = null;
  }, [stopTransport]);

  // Sync BPM to transport while playing (scaled for MIDI timing)
  useEffect(() => {
    if (isPlaying) Tone.getTransport().bpm.value = (bpm / ORIGINAL_BPM) * 120;
  }, [bpm, isPlaying]);

  const togglePlay = useCallback(async () => {
    if (!isAudioStarted) await startAudio();

    if (isPlaying) {
      stopTransport();
      setIsPlaying(false);
      setCountIn(null);
      setCurrentBar(null);
      return;
    }

    if (!midiRef.current) return; // MIDI not loaded yet

    // Create drum kit on first play and wait for samples to load
    if (!drumKitRef.current) {
      const kit = createDrumKit();
      drumKitRef.current = kit;
      await kit.loaded;
    }

    // Click synth for count-in only
    clickSynthRef.current = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.07 },
      volume: -10,
    }).toDestination();

    const transport = Tone.getTransport();
    // Scale transport BPM so MIDI note times (in seconds at original tempo)
    // play back at the correct speed. At 120 = 1:1 ratio.
    transport.bpm.value = (bpm / ORIGINAL_BPM) * 120;
    transport.loop = false;

    // Build Tone.Part for each MIDI track
    const midi = midiRef.current;
    const activeTracks = midi.tracks.filter(t => t.notes.length > 0);
    const totalDuration = Math.max(
      ...activeTracks.map(t => Math.max(...t.notes.map(n => n.time + n.duration)))
    );

    const kit = drumKitRef.current;
    const parts: Tone.Part[] = [];

    for (const track of activeTracks) {
      const notes = track.notes.map(n => ({
        time: n.time,
        midi: n.midi,
        velocity: n.velocity,
      }));
      const part = new Tone.Part((time, value: { midi: number; velocity: number }) => {
        kit.trigger(value.midi, time, value.velocity);
      }, notes);
      part.loop = true;
      part.loopEnd = totalDuration;
      part.start("1m"); // starts after the 1-bar count-in
      parts.push(part);
    }
    partsRef.current = parts;

    // Beat-tracking loop: first 4 beats = count-in, then track bars
    beatRef.current = 0;
    loopRef.current = new Tone.Loop((time) => {
      const beat = beatRef.current;
      if (beat < 4) {
        // Count-in click on every beat
        clickSynthRef.current?.triggerAttackRelease(
          beat % 4 === 0 ? "C5" : "G4", "64n", time,
        );
      }
      Tone.getDraw().schedule(() => {
        if (beat < 4) {
          setCountIn(4 - beat);
          setCurrentBar(null);
        } else {
          setCountIn(null);
          setCurrentBar(Math.floor((beat - 4) / 4) % 12);
        }
      }, time);
      beatRef.current++;
    }, "4n");

    loopRef.current.start(0);
    transport.start();
    setIsPlaying(true);
  }, [isAudioStarted, startAudio, isPlaying, bpm, stopTransport]);

  const playChord = useCallback(async (degree: BluesDegree) => {
    const chordDef = CHORDS.find(c => c.name === chordMap[degree]);
    if (!chordDef) return;
    if (!isAudioStarted) await startAudio();
    if (!arpeggioSynthRef.current) {
      arpeggioSynthRef.current = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.15, release: 1.2 },
        volume: -8,
      }).toDestination();
    }
    const now = Tone.now();
    let step = 0;
    chordDef.frets.forEach((fret, i) => {
      if (fret < 0) return;
      arpeggioSynthRef.current!.triggerAttackRelease(
        Tone.Frequency(OPEN_STRING_MIDI[i] + fret, "midi").toNote(), "8n", now + step * 0.08,
      );
      step++;
    });
    setHighlighted(degree);
    setTimeout(() => setHighlighted(null), 700);
  }, [isAudioStarted, startAudio, chordMap]);

  const activeDegree = currentBar !== null ? PROGRESSION[currentBar] : null;

  return (
    <div className="flex flex-col gap-6 px-4 py-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">12-Bar Blues</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Scegli una chiave e suona insieme alla progressione
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Key selector */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Chiave
            </legend>
            <div className="flex gap-2 flex-wrap">
              {BLUES_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => setActiveKey(k)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                    activeKey === k
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 12-bar grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Progressione
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PROGRESSION.map((degree, i) => {
                const isActive = currentBar === i;
                return (
                  <button
                    key={i}
                    onClick={() => playChord(degree)}
                    className={`relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all duration-150 active:scale-95 ${
                      DEGREE_COLORS[degree]
                    } ${isActive ? "ring-2 ring-offset-1 ring-gray-900 dark:ring-white scale-105 shadow-lg" : ""}`}
                  >
                    <span className="text-[10px] font-semibold opacity-60 mb-0.5">{i + 1}</span>
                    <span className="text-base font-bold leading-tight">{chordMap[degree]}</span>
                    <span className="text-[11px] opacity-70 mt-0.5">{DEGREE_LABELS[degree]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full border-t border-gray-100 dark:border-gray-700" />

          {/* Chord diagrams */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Accordi
            </p>
            <div className="flex flex-wrap gap-6">
              {(["I7", "IV7", "V7"] as BluesDegree[]).map(degree => {
                const chordDef = CHORDS.find(c => c.name === chordMap[degree]);
                if (!chordDef) return null;
                const isActive = activeDegree === degree || highlighted === degree;
                return (
                  <div
                    key={degree}
                    className={`flex flex-col items-center gap-1 rounded-2xl transition-all duration-150 ${
                      isActive ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900" : ""
                    }`}
                  >
                    <span className={`text-[11px] font-bold text-white rounded-md px-2 py-0.5 ${DEGREE_BADGE_COLORS[degree]}`}>
                      {degree}
                    </span>
                    <ChordDiagram chord={chordDef} onClick={() => playChord(degree)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: metronome */}
        <div className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4 flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5">
          {/* BPM */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Tempo
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBpm(b => Math.max(40, b - 1))}
                className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
              >−</button>
              <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white w-14 text-center">{bpm}</span>
              <button
                onClick={() => setBpm(b => Math.min(240, b + 1))}
                className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
              >+</button>
            </div>
            <input
              type="range" min={40} max={240} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full accent-indigo-500"
              aria-label="BPM"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">BPM</span>
          </div>

          {/* Play/Stop */}
          <button
            onClick={togglePlay}
            disabled={!midiReady}
            className={`w-full rounded-xl py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPlaying
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/30"
            }`}
          >
            {isPlaying ? "⏹ Stop" : midiReady ? "▶ Play" : "Loading…"}
          </button>

          {/* Status / count-in */}
          <div className="flex flex-col items-center justify-center min-h-[52px] gap-1">
            {countIn !== null && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500">Count in…</p>
                <span className="text-5xl font-black text-indigo-500 leading-none">{countIn}</span>
              </>
            )}
            {isPlaying && currentBar !== null && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Bar <span className="font-bold text-gray-900 dark:text-white">{currentBar + 1}</span>
                <span className="text-gray-400"> / 12</span>
              </p>
            )}
            {!isPlaying && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                4/4 · Blues 12 bar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
