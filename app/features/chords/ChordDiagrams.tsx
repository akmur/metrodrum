import { useState, useRef, useCallback } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";
import ChordDiagram from "./ChordDiagram";
import { CHORDS, ROOTS, QUALITIES, OPEN_STRING_MIDI, type Root, type Quality } from "./chord-data";

const QUALITY_LABELS: Record<Quality, string> = {
  maj: "Major",
  min: "Minor",
  "7": "Dom 7",
  sus2: "Sus2",
  sus4: "Sus4",
};

export default function ChordDiagrams() {
  const { isAudioStarted, startAudio } = useAudio();
  const synthRef = useRef<Tone.Synth | null>(null);
  const [activeRoot, setActiveRoot] = useState<Root | null>(null);
  const [activeQuality, setActiveQuality] = useState<Quality | null>(null);

  const filteredChords = CHORDS.filter(c => {
    if (activeRoot && c.root !== activeRoot) return false;
    if (activeQuality && c.quality !== activeQuality) return false;
    return true;
  });

  const playArpeggio = useCallback(async (frets: readonly number[]) => {
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
    frets.forEach((fret, i) => {
      if (fret < 0) return; // muted string
      const midi = OPEN_STRING_MIDI[i] + fret;
      const note = Tone.Frequency(midi, "midi").toNote();
      synth.triggerAttackRelease(note, "8n", now + step * 0.08);
      step++;
    });
  }, [isAudioStarted, startAudio]);

  function FilterButton({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
          active
            ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col gap-7">

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Root filter */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Root
            </legend>
            <div className="flex flex-wrap gap-2">
              {ROOTS.map(root => (
                <FilterButton
                  key={root}
                  label={root}
                  active={activeRoot === root}
                  onClick={() => setActiveRoot(prev => prev === root ? null : root)}
                />
              ))}
            </div>
          </fieldset>

          {/* Quality filter */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Quality
            </legend>
            <div className="flex flex-wrap gap-2">
              {QUALITIES.map(q => (
                <FilterButton
                  key={q}
                  label={QUALITY_LABELS[q]}
                  active={activeQuality === q}
                  onClick={() => setActiveQuality(prev => prev === q ? null : q)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="w-full border-t border-gray-100 dark:border-gray-700" />

        {/* Chord grid */}
        {filteredChords.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
            No chords found for this combination.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {filteredChords.map(chord => (
              <ChordDiagram
                key={chord.name}
                chord={chord}
                onClick={() => playArpeggio(chord.frets)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
