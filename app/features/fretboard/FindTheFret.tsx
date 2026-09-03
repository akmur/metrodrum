import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePitchDetector } from "./usePitchDetector";

const STRINGS = ["E", "A", "D", "G", "B", "e"] as const;
type StringName = (typeof STRINGS)[number];

const NOTES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FindTheFret() {
  const [selected, setSelected] = useState<Record<StringName, boolean>>(
    () => Object.fromEntries(STRINGS.map(s => [s, true])) as Record<StringName, boolean>
  );
  const [current, setCurrent] = useState<{ note: (typeof NOTES)[number]; string: StringName } | null>(null);
  const [listen, setListen] = useState(false);

  const activeStrings = useMemo(() => STRINGS.filter(s => selected[s]), [selected]);

  const started = current !== null;
  const { note: detectedNote, error: micError } = usePitchDetector(listen && started);

  const targetPc = current ? NOTES.indexOf(current.note) : null;
  const isMatch = detectedNote !== null && targetPc !== null && detectedNote.midi % 12 === targetPc;

  const nextPrompt = useCallback(() => {
    setCurrent({
      note: pickRandom(NOTES),
      string: pickRandom(activeStrings),
    });
  }, [activeStrings]);

  const canAdvanceRef = useRef(true);

  // Re-arm only after silence so a held note can't cascade into the next prompt.
  useEffect(() => {
    if (detectedNote === null) canAdvanceRef.current = true;
  }, [detectedNote]);

  // Auto-advance when the correct note is played.
  useEffect(() => {
    if (isMatch && canAdvanceRef.current) {
      canAdvanceRef.current = false;
      const t = setTimeout(nextPrompt, 600);
      return () => clearTimeout(t);
    }
  }, [isMatch, nextPrompt]);

  const toggleString = (s: StringName) => {
    setSelected(prev => ({ ...prev, [s]: !prev[s] }));
  };

  const reset = () => {
    setSelected(Object.fromEntries(STRINGS.map(s => [s, true])) as Record<StringName, boolean>);
    setCurrent(null);
  };

  return (
    <div className="w-full max-w-3xl bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
        Find the fret
      </h2>

      {/* String checkboxes */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Strings
        </span>
        <div className="flex flex-wrap gap-4">
          {STRINGS.map(s => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 select-none cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected[s]}
                onChange={() => toggleString(s)}
                className="w-4 h-4 accent-indigo-500"
              />
              {s}
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 select-none cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={listen}
            onChange={e => setListen(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          Listen to microphone
        </label>
      </div>

      {/* Prompt */}
      {started && current && (
        <div className="flex flex-col items-center gap-1 py-4">
          <span className="text-sm text-gray-400 dark:text-gray-500">Find</span>
          <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
            {current.note}
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-300">
            on the <strong className="text-indigo-600 dark:text-indigo-400">{current.string}</strong> string
          </span>

          {listen && (
            <div className="mt-3">
              {micError ? (
                <span className="text-sm text-red-500 dark:text-red-400">
                  Microphone error: {micError}
                </span>
              ) : detectedNote ? (
                <span
                  className={`text-xl font-bold ${
                    isMatch
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {NOTES[detectedNote.midi % 12]} {isMatch ? "✓" : "✗"}
                </span>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  Listening…
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-center gap-3">
        {started ? (
          <>
            <button
              onClick={nextPrompt}
              disabled={activeStrings.length === 0}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              onClick={reset}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={nextPrompt}
            disabled={activeStrings.length === 0}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}
