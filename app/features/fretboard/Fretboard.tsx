import { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";

const CHROMATIC = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
type Note = (typeof CHROMATIC)[number];

// Guitar: high E → low E open string MIDI notes (standard tuning)
const GUITAR_LABELS = ["E", "B", "G", "D", "A", "E"] as const;
const GUITAR_OPEN_IDX = [4, 11, 7, 2, 9, 4] as const;
const GUITAR_OPEN_MIDI = [64, 59, 55, 50, 45, 40] as const;

// Bass: G → low E open string MIDI notes
const BASS_LABELS = ["G", "D", "A", "E"] as const;
const BASS_OPEN_IDX = [7, 2, 9, 4] as const;
const BASS_OPEN_MIDI = [43, 38, 33, 28] as const;

// Flat display label → canonical sharp Note
const FLAT_TO_NOTE: Record<string, Note> = {
  "D♭": "C#",
  "E♭": "D#",
  "G♭": "F#",
  "A♭": "G#",
  "B♭": "A#",
};

function getNoteAt(openIdx: readonly number[], stringIdx: number, fret: number): Note {
  return CHROMATIC[(openIdx[stringIdx] + fret) % 12];
}

function isCorrect(label: string, target: Note): boolean {
  return label === target || FLAT_TO_NOTE[label] === target;
}

// SVG fretboard geometry
const VW = 900, VH = 200;
const LM = 30, RM = 10, TM = 12, BM = 28;
const BW = VW - LM - RM;
const BH = VH - TM - BM;
const FW = BW / 12;

const SINGLE_DOT_FRETS = [3, 5, 7, 9];

// Note button grid layout: [label, startCol (1-based)]
const SHARP_BUTTONS: Array<[string, number]> = [
  ["C#", 2], ["D#", 4], ["F#", 8], ["G#", 10], ["A#", 12],
];
const NATURAL_BUTTONS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const FLAT_BUTTONS: Array<[string, number]> = [
  ["D♭", 2], ["E♭", 4], ["G♭", 8], ["A♭", 10], ["B♭", 12],
];

interface NoteButtonProps {
  label: string;
  isWrong: boolean;
  isReveal: boolean;
  disabled: boolean;
  onClick: (label: string) => void;
}

function NoteButton({ label, isWrong, isReveal, disabled, onClick }: NoteButtonProps) {
  return (
    <button
      onClick={() => onClick(label)}
      disabled={disabled}
      className={`w-full rounded-xl border text-sm font-semibold py-3 transition-colors select-none
        ${isWrong
          ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300"
          : isReveal
          ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300"
          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer disabled:cursor-default"
        }`}
    >
      {label}
    </button>
  );
}

export default function Fretboard() {
  const { isAudioStarted, startAudio } = useAudio();
  const synthRef = useRef<Tone.Synth | null>(null);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [pos, setPos] = useState<{ string: number; fret: number } | null>(null);
  const [answered, setAnswered] = useState<"correct" | "wrong" | null>(null);
  const [wrongLabel, setWrongLabel] = useState<string | null>(null);
  const [isBass, setIsBass] = useState(false);

  const stringLabels = isBass ? BASS_LABELS : GUITAR_LABELS;
  const openIdx = isBass ? BASS_OPEN_IDX : GUITAR_OPEN_IDX;
  const openMidi = isBass ? BASS_OPEN_MIDI : GUITAR_OPEN_MIDI;
  const stringCount = stringLabels.length;
  const SS = BH / (stringCount - 1);

  const playNote = useCallback(async (stringIdx: number, fret: number) => {
    if (!isAudioStarted) await startAudio();
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 0.8 },
        volume: -6,
      }).toDestination();
    }
    const midiNote = openMidi[stringIdx] + fret;
    const noteName = Tone.Frequency(midiNote, "midi").toNote();
    synthRef.current.triggerAttackRelease(noteName, "8n");
  }, [isAudioStarted, startAudio, openMidi]);

  const nextNote = useCallback((count: number) => {
    setPos({
      string: Math.floor(Math.random() * count),
      fret: Math.floor(Math.random() * 12) + 1,
    });
    setAnswered(null);
    setWrongLabel(null);
  }, []);

  useEffect(() => {
    return () => { try { synthRef.current?.dispose(); } catch { /* ignore */ } };
  }, []);

  useEffect(() => {
    setScore({ correct: 0, total: 0 });
    nextNote(stringCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBass]);

  const handleAnswer = useCallback((label: string) => {
    if (!pos || answered !== null) return;
    const target = getNoteAt(openIdx, pos.string, pos.fret);
    if (isCorrect(label, target)) {
      setAnswered("correct");
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
      setTimeout(() => nextNote(stringCount), 700);
    } else {
      setAnswered("wrong");
      setWrongLabel(label);
      setScore(s => ({ correct: s.correct, total: s.total + 1 }));
      setTimeout(() => nextNote(stringCount), 900);
    }
  }, [pos, answered, nextNote, openIdx, stringCount]);

  const percentage = score.total === 0
    ? 0
    : Math.round((score.correct / score.total) * 100);

  const correctNote = pos ? getNoteAt(openIdx, pos.string, pos.fret) : null;

  function renderButton(label: string) {
    return (
      <NoteButton
        label={label}
        isWrong={label === wrongLabel}
        isReveal={answered === "wrong" && correctNote !== null && isCorrect(label, correctNote)}
        disabled={answered !== null}
        onClick={handleAnswer}
      />
    );
  }

  const dotFill = answered === "correct" ? "#22c55e" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4">
      {/* Score */}
      <div className="flex gap-12 text-xl font-semibold text-gray-600 dark:text-gray-300">
        <span>{score.correct}/{score.total}</span>
        <span>{percentage}%</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-3xl bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col gap-10">

        {/* Fretboard SVG */}
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" aria-label="Guitar fretboard">
          {/* String lines + labels */}
          {stringLabels.map((label, i) => {
            const y = TM + i * SS;
            return (
              <g key={i}>
                <text
                  x={LM - 8} y={y + 4}
                  textAnchor="middle" fontSize={13}
                  className="fill-gray-600 dark:fill-gray-400"
                >
                  {label}
                </text>
                <line
                  x1={LM} y1={y} x2={LM + BW} y2={y}
                  strokeWidth={1.5}
                  className="stroke-gray-400 dark:stroke-gray-500"
                />
              </g>
            );
          })}

          {/* Nut */}
          <line
            x1={LM} y1={TM} x2={LM} y2={TM + BH}
            strokeWidth={7}
            className="stroke-gray-900 dark:stroke-gray-200"
          />

          {/* Fret lines + numbers */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = LM + (i + 1) * FW;
            return (
              <g key={i}>
                <line
                  x1={x} y1={TM} x2={x} y2={TM + BH}
                  strokeWidth={1.5}
                  className="stroke-gray-800 dark:stroke-gray-500"
                />
                <text
                  x={LM + (i + 0.5) * FW} y={VH - 4}
                  textAnchor="middle" fontSize={11}
                  className="fill-gray-500 dark:fill-gray-400"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Single position dots (frets 3, 5, 7, 9) */}
          {SINGLE_DOT_FRETS.map(fret => (
            <circle
              key={fret}
              cx={LM + (fret - 0.5) * FW}
              cy={TM + BH / 2}
              r={5}
              className="fill-gray-300 dark:fill-gray-600"
            />
          ))}

          {/* Double dot at fret 12 */}
          {[1, 3].map(i => (
            <circle
              key={i}
              cx={LM + 11.5 * FW}
              cy={TM + i * SS}
              r={5}
              className="fill-gray-300 dark:fill-gray-600"
            />
          ))}

          {/* Active note dot */}
          {pos && (
            <circle
              cx={LM + (pos.fret - 0.5) * FW}
              cy={TM + pos.string * SS}
              r={13}
              fill={dotFill}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label="Play note"
              onClick={() => playNote(pos.string, pos.fret)}
            />
          )}
        </svg>

        {/* Note buttons — 14-column grid, piano-like layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: "6px" }}
          role="group"
          aria-label="Note buttons"
        >
          {/* Row 1: Sharps */}
          {SHARP_BUTTONS.map(([label, col]) => (
            <div key={label} style={{ gridColumn: `${col} / span 2`, gridRow: 1 }}>
              {renderButton(label)}
            </div>
          ))}

          {/* Row 2: Naturals */}
          {NATURAL_BUTTONS.map((label, i) => (
            <div key={label} style={{ gridColumn: `${i * 2 + 1} / span 2`, gridRow: 2 }}>
              {renderButton(label)}
            </div>
          ))}

          {/* Row 3: Flats */}
          {FLAT_BUTTONS.map(([label, col]) => (
            <div key={label} style={{ gridColumn: `${col} / span 2`, gridRow: 3 }}>
              {renderButton(label)}
            </div>
          ))}
        </div>

        {/* Bass toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={isBass}
            onChange={e => setIsBass(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          Bass (4 strings)
        </label>
      </div>
    </div>
  );
}
