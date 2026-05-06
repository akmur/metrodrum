import { useState, useRef, useCallback } from "react";
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

const DEGREE_LABELS: Record<BluesDegree, string> = {
  I7: "I7",
  IV7: "IV7",
  V7: "V7",
};

export default function Blues() {
  const { isAudioStarted, startAudio } = useAudio();
  const synthRef = useRef<Tone.Synth | null>(null);
  const [activeKey, setActiveKey] = useState<BluesKey>("E");
  const [highlighted, setHighlighted] = useState<BluesDegree | null>(null);

  const chordMap = BLUES_CHORDS[activeKey];

  const playChord = useCallback(
    async (degree: BluesDegree) => {
      const chordName = chordMap[degree];
      const chordDef = CHORDS.find(c => c.name === chordName);
      if (!chordDef) return;
      if (!isAudioStarted) await startAudio();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.005, decay: 0.4, sustain: 0.15, release: 1.2 },
          volume: -8,
        }).toDestination();
      }
      const synth = synthRef.current;
      const now = Tone.now();
      let step = 0;
      chordDef.frets.forEach((fret, i) => {
        if (fret < 0) return;
        const midi = OPEN_STRING_MIDI[i] + fret;
        synth.triggerAttackRelease(Tone.Frequency(midi, "midi").toNote(), "8n", now + step * 0.08);
        step++;
      });
      setHighlighted(degree);
      setTimeout(() => setHighlighted(null), 700);
    },
    [isAudioStarted, startAudio, chordMap],
  );

  return (
    <div className="flex flex-col gap-8 px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">12-Bar Blues</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Scegli una chiave e studia la progressione classica
        </p>
      </div>

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
          {PROGRESSION.map((degree, i) => (
            <button
              key={i}
              onClick={() => playChord(degree)}
              className={`relative flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all active:scale-95 ${
                DEGREE_COLORS[degree]
              } ${highlighted === degree ? "scale-105 shadow-md" : ""}`}
            >
              <span className="text-[10px] font-semibold opacity-60 mb-0.5">{i + 1}</span>
              <span className="text-base font-bold leading-tight">{chordMap[degree]}</span>
              <span className="text-[11px] opacity-70 mt-0.5">{DEGREE_LABELS[degree]}</span>
            </button>
          ))}
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
            const chordName = chordMap[degree];
            const chordDef = CHORDS.find(c => c.name === chordName);
            if (!chordDef) return null;
            return (
              <div key={degree} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[11px] font-bold text-white rounded-md px-2 py-0.5 ${DEGREE_BADGE_COLORS[degree]}`}
                >
                  {degree}
                </span>
                <ChordDiagram chord={chordDef} onClick={() => playChord(degree)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
