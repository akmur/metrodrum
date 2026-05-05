import { useEffect } from "react";
import TriadDiagram from "./TriadDiagram";
import {
  INVERSION_LABELS,
  QUALITY_LABELS,
  STRING_GROUP_LABELS,
  type TriadShape,
} from "./triad-data";

interface Props {
  shape: TriadShape;
  onClose: () => void;
  onPlay: () => void;
}

export default function TriadModal({ shape, onClose, onPlay }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${shape.rootName} ${shape.quality} ${INVERSION_LABELS[shape.inversion]}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 min-w-[260px]">

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xl leading-none"
        >
          ✕
        </button>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {shape.rootName} <span className="text-indigo-500">{QUALITY_LABELS[shape.quality]}</span>
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium">
              {INVERSION_LABELS[shape.inversion]}
            </span>
            <span className="text-gray-400 dark:text-gray-500">·</span>
            <span className="text-gray-500 dark:text-gray-400">
              corde {STRING_GROUP_LABELS[shape.group]}
            </span>
          </div>
        </div>

        {/* Enlarged diagram — click to play */}
        <TriadDiagram
          shape={shape}
          displayWidth={220}
          onClick={onPlay}
        />

        {/* Play hint */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Clicca sul diagramma per ascoltare
        </p>
      </div>
    </div>
  );
}
