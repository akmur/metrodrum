import { useState, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";
import TriadDiagram from "./TriadDiagram";
import TriadModal from "./TriadModal";
import {
  ALL_ROOTS,
  STRING_GROUPS,
  STRING_GROUP_LABELS,
  QUALITIES,
  QUALITY_LABELS,
  INVERSIONS,
  POSITIONS,
  POSITION_LABELS,
  computeAllShapes,
  type StringGroup,
  type Quality,
  type Position,
  type TriadShape,
} from "./triad-data";

export default function Triads() {
  const { isAudioStarted, startAudio } = useAudio();
  const synthRef = useRef<Tone.Synth | null>(null);
  const [activeGroup, setActiveGroup] = useState<StringGroup>("GBe");
  const [activeQuality, setActiveQuality] = useState<Quality>("maj");
  const [activePosition, setActivePosition] = useState<Position>(5);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [modalShape, setModalShape] = useState<TriadShape | null>(null);

  // Pre-compute all shapes for current group + quality
  const shapes = useMemo(
    () => computeAllShapes(activeGroup, activeQuality, activePosition),
    [activeGroup, activeQuality, activePosition],
  );

  const playArpeggio = useCallback(
    async (midiNotes: readonly [number, number, number], key: string) => {
      if (!isAudioStarted) await startAudio();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 1.2 },
          volume: -8,
        }).toDestination();
      }
      const synth = synthRef.current;
      const now = Tone.now();
      midiNotes.forEach((midi, i) => {
        const note = Tone.Frequency(midi, "midi").toNote();
        synth.triggerAttackRelease(note, "8n", now + i * 0.09);
      });
      setLastPlayed(key);
      setTimeout(() => setLastPlayed(null), 800);
    },
    [isAudioStarted, startAudio],
  );

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
    <>
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col gap-7">

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              String Group
            </legend>
            <div className="flex flex-wrap gap-2">
              {STRING_GROUPS.map(g => (
                <FilterButton
                  key={g}
                  label={STRING_GROUP_LABELS[g]}
                  active={activeGroup === g}
                  onClick={() => setActiveGroup(g)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Posizione
            </legend>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map(p => (
                <FilterButton
                  key={p}
                  label={`${POSITION_LABELS[p]} pos.`}
                  active={activePosition === p}
                  onClick={() => setActivePosition(p)}
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
                  onClick={() => setActiveQuality(q)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="w-full border-t border-gray-100 dark:border-gray-700" />

        {/* Triads grouped by root */}
        <div className="flex flex-col gap-5">
          {ALL_ROOTS.map((rootName, rootIdx) => {
            const inversions = shapes[rootIdx];
            return (
              <div key={rootName} className="flex items-center gap-4">
                {/* Root label */}
                <span className="w-8 text-sm font-bold text-gray-700 dark:text-gray-200 shrink-0">
                  {rootName}
                </span>
                {/* 3 inversions */}
                <div className="flex gap-3">
                  {INVERSIONS.map(inv => {
                    const shape = inversions.find(s => s.inversion === inv)!;
                    const key = `${rootName}-${inv}`;
                    return (
                      <TriadDiagram
                        key={inv}
                        shape={shape}
                        active={lastPlayed === key}
                        onClick={() => {
                          setModalShape(shape);
                          playArpeggio(shape.midiNotes, key);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>

    {/* Detail modal */}
    {modalShape && (
      <TriadModal
        shape={modalShape}
        onClose={() => setModalShape(null)}
        onPlay={() => playArpeggio(modalShape.midiNotes, `modal-${modalShape.rootName}-${modalShape.inversion}`)}
      />
    )}
  </>
  );
}
