import type { ChordDef } from "./chord-data";

interface Props {
  chord: ChordDef;
  onClick?: () => void;
}

const STRINGS = 6;
const FRETS_SHOWN = 4;

// SVG dimensions
const W = 100, H = 130;
const TOP = 28;   // space above nut for mute/open markers
const LEFT = 14;  // left margin for string labels
const RIGHT = 10;
const BOTTOM = 14;
const IW = W - LEFT - RIGHT;   // inner width
const IH = H - TOP - BOTTOM;   // inner height
const SW = IW / (STRINGS - 1); // string spacing
const FH = IH / FRETS_SHOWN;   // fret spacing
const R = 8;                    // dot radius

export default function ChordDiagram({ chord, onClick }: Props) {
  const minFret = Math.min(...chord.frets.filter(f => f > 0));
  // For open chords always start at fret 1
  const startFret = 1;

  return (
    <button
      onClick={onClick}
      aria-label={`${chord.name} chord`}
      className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all active:scale-95 cursor-pointer"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        aria-hidden="true"
      >
        {/* Chord name */}
        <text
          x={W / 2} y={11}
          textAnchor="middle"
          fontSize={13}
          fontWeight="bold"
          className="fill-gray-800 dark:fill-gray-100"
        >
          {chord.name}
        </text>

        {/* Mute / Open markers above nut */}
        {chord.frets.map((fret, i) => {
          const cx = LEFT + i * SW;
          const cy = TOP - 9;
          if (fret === -1) {
            // X marker
            return (
              <g key={i}>
                <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} strokeWidth={1.5} className="stroke-gray-500 dark:stroke-gray-400" />
                <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} strokeWidth={1.5} className="stroke-gray-500 dark:stroke-gray-400" />
              </g>
            );
          }
          if (fret === 0) {
            // O marker
            return (
              <circle key={i} cx={cx} cy={cy} r={4} strokeWidth={1.5} fill="none" className="stroke-gray-500 dark:stroke-gray-400" />
            );
          }
          return null;
        })}

        {/* Nut (thick line at top) */}
        <rect
          x={LEFT} y={TOP}
          width={IW} height={4}
          rx={1}
          className="fill-gray-800 dark:fill-gray-200"
        />

        {/* Fret lines */}
        {Array.from({ length: FRETS_SHOWN }, (_, i) => (
          <line
            key={i}
            x1={LEFT} y1={TOP + (i + 1) * FH}
            x2={LEFT + IW} y2={TOP + (i + 1) * FH}
            strokeWidth={1}
            className="stroke-gray-300 dark:stroke-gray-600"
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={i}
            x1={LEFT + i * SW} y1={TOP + 4}
            x2={LEFT + i * SW} y2={TOP + IH}
            strokeWidth={i === 0 || i === STRINGS - 1 ? 1.5 : 1}
            className="stroke-gray-400 dark:stroke-gray-500"
          />
        ))}

        {/* Finger dots */}
        {chord.frets.map((fret, i) => {
          if (fret <= 0) return null;
          const displayFret = fret - startFret + 1;
          if (displayFret < 1 || displayFret > FRETS_SHOWN) return null;
          const cx = LEFT + i * SW;
          const cy = TOP + (displayFret - 0.5) * FH;
          const finger = chord.fingers[i];
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={R} className="fill-gray-800 dark:fill-gray-100" />
              {finger > 0 && (
                <text
                  x={cx} y={cy + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="bold"
                  className="fill-white dark:fill-gray-900"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </button>
  );
}
