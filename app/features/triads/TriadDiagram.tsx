import { INVERSION_LABELS, INVERSION_ORDER, type TriadShape } from "./triad-data";

const DEGREE_LABELS = ["1", "3", "5"] as const;

const STRINGS = 3;
const FRETS_SHOWN = 4;

const W = 90, H = 120;
const TOP = 26;
const LEFT = 12;
const RIGHT = 30; // extra room for fret indicator
const BOTTOM = 14;
const IW = W - LEFT - RIGHT;
const IH = H - TOP - BOTTOM;
const SW = IW / (STRINGS - 1);
const FH = IH / FRETS_SHOWN;
const R = 8;

interface Props {
  shape: TriadShape;
  active?: boolean;
  onClick: () => void;
  /** Rendered SVG width (height auto-scaled). Defaults to W=90 */
  displayWidth?: number;
}

export default function TriadDiagram({ shape, active, onClick, displayWidth }: Props) {
  const { frets, startFret, rootName, inversion } = shape;
  const showNut = startFret === 1;
  const degreeOrder = INVERSION_ORDER[inversion];
  const dw = displayWidth ?? W;
  const dh = Math.round((dw / W) * H);

  return (
    <button
      onClick={onClick}
      aria-label={`${rootName} ${shape.quality} ${INVERSION_LABELS[shape.inversion]}`}
      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
        active
          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-md shadow-indigo-400/20"
          : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm"
      }`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width={dw} height={dh} aria-hidden="true">
        {/* Fret position indicator (when not starting at nut) */}
        {!showNut && (
          <text
            x={W - RIGHT + R + 2} y={TOP + FH * 0.6}
            textAnchor="start"
            fontSize={9}
            className="fill-gray-500 dark:fill-gray-400"
          >
            {startFret}fr
          </text>
        )}

        {/* Nut */}
        {showNut && (
          <rect
            x={LEFT} y={TOP}
            width={IW} height={4}
            rx={1}
            className="fill-gray-800 dark:fill-gray-200"
          />
        )}

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

        {/* Top fret line (if no nut) */}
        {!showNut && (
          <line
            x1={LEFT} y1={TOP}
            x2={LEFT + IW} y2={TOP}
            strokeWidth={1}
            className="stroke-gray-300 dark:stroke-gray-600"
          />
        )}

        {/* String lines */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={i}
            x1={LEFT + i * SW} y1={TOP + (showNut ? 4 : 0)}
            x2={LEFT + i * SW} y2={TOP + IH}
            strokeWidth={i === 0 || i === STRINGS - 1 ? 1.5 : 1}
            className="stroke-gray-400 dark:stroke-gray-500"
          />
        ))}

        {/* Open string markers (O) */}
        {frets.map((fret, i) => {
          if (fret !== 0) return null;
          return (
            <circle
              key={i}
              cx={LEFT + i * SW} cy={TOP - 9}
              r={4} fill="none" strokeWidth={1.5}
              className="stroke-gray-500 dark:stroke-gray-400"
            />
          );
        })}

        {/* Finger dots with interval label */}
        {frets.map((fret, i) => {
          if (fret === 0) return null;
          const displayRow = fret - startFret + 1;
          if (displayRow < 1 || displayRow > FRETS_SHOWN) return null;
          const cx = LEFT + i * SW;
          const cy = TOP + (displayRow - 0.5) * FH;
          const label = DEGREE_LABELS[degreeOrder[i]];
          return (
            <g key={i}>
              <circle
                cx={cx} cy={cy} r={R}
                className="fill-gray-800 dark:fill-gray-100"
              />
              <text
                x={cx} y={cy + 3.5}
                textAnchor="middle"
                fontSize={8}
                fontWeight="bold"
                className="fill-white dark:fill-gray-900"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Inversion label */}
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-none pb-0.5">
        {INVERSION_LABELS[shape.inversion]}
      </span>
    </button>
  );
}
