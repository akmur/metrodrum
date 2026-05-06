import { useState } from "react";
import ChordDiagram from "./ChordDiagram";
import { CHORDS, ROOTS, QUALITIES, type Root, type Quality, type ChordDef } from "./chord-data";

const QUALITY_LABELS: Record<Quality, string> = {
  maj: "Major",
  min: "Minor",
  "7": "Dom 7",
  sus2: "Sus2",
  sus4: "Sus4",
};

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function ChordModal({ chord, onClose }: { chord: ChordDef; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 rounded-3xl bg-white dark:bg-gray-800 p-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ChordDiagram chord={chord} size={2.5} />
      </div>
    </div>
  );
}

export default function ChordDiagrams() {
  const [activeRoot, setActiveRoot] = useState<Root | null>(null);
  const [activeQuality, setActiveQuality] = useState<Quality | null>(null);
  const [selectedChord, setSelectedChord] = useState<ChordDef | null>(null);

  const filteredChords = CHORDS.filter(c => {
    if (activeRoot && c.root !== activeRoot) return false;
    if (activeQuality && c.quality !== activeQuality) return false;
    return true;
  });

  return (
    <>
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col gap-7">

          {/* Filters */}
          <div className="flex flex-col gap-4">
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
                  onClick={() => setSelectedChord(chord)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {selectedChord && (
        <ChordModal chord={selectedChord} onClose={() => setSelectedChord(null)} />
      )}
    </>
  );
}
