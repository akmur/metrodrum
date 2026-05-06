import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";
import ChordDiagram from "@/features/chords/ChordDiagram";
import { CHORDS, OPEN_STRING_MIDI } from "@/features/chords/chord-data";
import {
  BLUES_KEYS,
  BLUES_CHORDS,
  PROGRESSION,
  DEGREE_COLORS,
  DEGREE_BADGE_COLORS,
  type BluesKey,
  type BluesDegree,
} from "./blues-data";

const DEGREE_LABELS: Record<BluesDegree, string> = { I7: "I7", IV7: "IV7", V7: "V7" };

// Available loop files: { bpm, url }
const LOOPS = [
  { bpm: 80,  url: "/samples/blues/blues-loop-80bpm.m4a"  },
  { bpm: 90,  url: "/samples/blues/blues-loop-90bpm.m4a"  },
  { bpm: 100, url: "/samples/blues/blues-loop-100bpm.m4a" },
  { bpm: 110, url: "/samples/blues/blues-loop-110bpm.m4a" },
  { bpm: 120, url: "/samples/blues/blues-loop-120bpm.m4a" },
] as const;
type LoopBpm = (typeof LOOPS)[number]["bpm"];

export default function Blues() {
  const { isAudioStarted, startAudio } = useAudio();
  const arpeggioSynthRef = useRef<Tone.Synth | null>(null);
  const clickSynthRef = useRef<Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const beatRef = useRef(0);

  const [activeKey, setActiveKey] = useState<BluesKey>("E");
  const [selectedBpm, setSelectedBpm] = useState<LoopBpm>(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [countIn, setCountIn] = useState<number | null>(null);
  const [currentBar, setCurrentBar] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<BluesDegree | null>(null);

  const chordMap = BLUES_CHORDS[activeKey];

  // Load audio player on mount (or when selected BPM changes)
  useEffect(() => {
    setAudioReady(false);
    const loop = LOOPS.find(l => l.bpm === selectedBpm)!;
    const player = new Tone.Player({
      url: loop.url,
      loop: true,
      onload: () => setAudioReady(true),
    }).toDestination();
    playerRef.current = player;
    return () => {
      try { player.stop(); player.unsync(); player.dispose(); } catch { /* */ }
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [selectedBpm]);

  // Stop transport helper
  const stopTransport = useCallback(() => {
    loopRef.current?.stop();
    try { loopRef.current?.dispose(); } catch { /* already disposed */ }
    loopRef.current = null;

    try { playerRef.current?.stop(); playerRef.current?.unsync(); } catch { /* */ }

    try { clickSynthRef.current?.dispose(); } catch { /* */ }
    clickSynthRef.current = null;

    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    beatRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopTransport(), [stopTransport]);

  const togglePlay = useCallback(async () => {
    if (!isAudioStarted) await startAudio();

    if (isPlaying) {
      stopTransport();
      setIsPlaying(false);
      setCountIn(null);
      setCurrentBar(null);
      return;
    }

    if (!playerRef.current || !audioReady) return;

    // Click synth for count-in only
    clickSynthRef.current = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.07 },
      volume: -10,
    }).toDestination();

    const transport = Tone.getTransport();
    transport.bpm.value = selectedBpm;
    transport.loop = false;

    // Sync player to transport — starts after the 4-beat count-in ("1m")
    playerRef.current.sync().start("1m");

    // Beat-tracking loop: first 4 beats = count-in click, then track bars
    beatRef.current = 0;
    loopRef.current = new Tone.Loop((time) => {
      const beat = beatRef.current;
      if (beat < 4) {
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
  }, [isAudioStarted, startAudio, isPlaying, selectedBpm, audioReady, stopTransport]);

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

        {/* Sidebar: player */}
        <div className="w-full lg:w-52 shrink-0 lg:sticky lg:top-4 flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5">
          {/* Tempo selector */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Tempo
            </label>
            <div className="flex gap-2 flex-wrap justify-center">
              {LOOPS.map(l => (
                <button
                  key={l.bpm}
                  disabled={isPlaying}
                  onClick={() => setSelectedBpm(l.bpm)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-40 ${
                    selectedBpm === l.bpm
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {l.bpm}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">BPM</span>
          </div>

          {/* Play/Stop */}
          <button
            onClick={togglePlay}
            disabled={!audioReady}
            className={`w-full rounded-xl py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isPlaying
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/30"
            }`}
          >
            {isPlaying ? "⏹ Stop" : audioReady ? "▶ Play" : "Loading…"}
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
