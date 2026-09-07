import { useState } from "react";
import TriadDiagram from "./TriadDiagram";
import {
  QUALITIES,
  QUALITY_LABELS,
  SHAPES,
  STRING_SETS,
  type Quality,
  type StringSetLabel,
  type TriadShape,
} from "./triad-data";

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

function TriadModal({ shape, onClose }: { shape: TriadShape; onClose: () => void }) {
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          {QUALITY_LABELS[shape.quality]} triad
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          {shape.inversion}
        </p>
        <TriadDiagram shape={shape} size={2.5} />
      </div>
    </div>
  );
}

export default function Triads() {
  const [activeQuality, setActiveQuality] = useState<Quality | null>(null);
  const [activeStringSet, setActiveStringSet] = useState<StringSetLabel | null>(null);
  const [selected, setSelected] = useState<TriadShape | null>(null);

  const stringSetMatches = (strings: TriadShape["strings"]) => {
    if (!activeStringSet) return true;
    const set = STRING_SETS.find(s => s.label === activeStringSet)!;
    return strings.every((s, i) => s === set.strings[i]);
  };

  const groups = QUALITIES.filter(q => !activeQuality || q === activeQuality)
    .map(quality => ({
      quality,
      shapes: SHAPES.filter(s => s.quality === quality && stringSetMatches(s.strings)),
    }))
    .filter(g => g.shapes.length > 0);

  return (
    <>
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col gap-7">

          {/* Filters */}
          <div className="flex flex-col gap-4">
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

            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Strings
              </legend>
              <div className="flex flex-wrap gap-2">
                {STRING_SETS.map(s => (
                  <FilterButton
                    key={s.label}
                    label={s.label}
                    active={activeStringSet === s.label}
                    onClick={() => setActiveStringSet(prev => prev === s.label ? null : s.label)}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          <div className="w-full border-t border-gray-100 dark:border-gray-700" />

          {/* Shape groups */}
          {groups.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
              No triads found for this combination.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map(group => (
                <section key={group.quality} className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    {QUALITY_LABELS[group.quality]}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {group.shapes.map((shape, i) => (
                      <TriadDiagram
                        key={`${shape.inversion}-${shape.strings.join()}-${i}`}
                        shape={shape}
                        onClick={() => setSelected(shape)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

        </div>
      </div>

      {selected && <TriadModal shape={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
