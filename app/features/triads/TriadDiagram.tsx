import type { TriadShape } from "./triad-data";
import { STRING_NOTES } from "./triad-data";

interface Props {
  shape: TriadShape;
  onClick?: () => void;
  size?: number;
}

const W = 110;
const LEFT = 30;
const RIGHT = 14;
const TOP = 30;
const BOTTOM = 24;
const FRET_H = 26;
const STRING_GAP = 28;
const DOT_R = 11;

export default function TriadDiagram({ shape, onClick, size = 1 }: Props) {
  const { strings, frets, inversion, intervals, rootIndex } = shape;

  const startFret = Math.min(...frets);
  const fretCount = Math.max(4, Math.max(...frets) - startFret + 1);

  const H = TOP + fretCount * FRET_H + BOTTOM;
  const IW = STRING_GAP * 2;
  const cx = (i: number) => LEFT + i * STRING_GAP;
  const rowOf = (fret: number) => fret - startFret + 1;
  const dotY = (row: number) => TOP + (row - 0.5) * FRET_H;
  const bottom = TOP + fretCount * FRET_H;

  return (
    <button
      onClick={onClick}
      aria-label={`${inversion}`}
      className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all active:scale-95 cursor-pointer"
    >
      <svg viewBox={`0 0 ${W} ${H}`} width={W * size} height={H * size} aria-hidden="true">
        {/* Inversion name */}
        <text
          x={W / 2} y={12}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          className="fill-gray-800 dark:fill-gray-100"
        >
          {inversion}
        </text>

        {/* Start-fret label */}
        <text
          x={LEFT - 10} y={TOP + FRET_H * 0.5}
          textAnchor="end" fontSize={10}
          className="fill-gray-500 dark:fill-gray-400"
        >
          {startFret}
        </text>

        {/* String lines */}
        {strings.map((s, i) => (
          <line
            key={i}
            x1={cx(i)} y1={TOP}
            x2={cx(i)} y2={bottom}
            strokeWidth={1.2}
            className="stroke-gray-400 dark:stroke-gray-500"
          />
        ))}

        {/* Fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => (
          <line
            key={i}
            x1={LEFT - 6} y1={TOP + i * FRET_H}
            x2={LEFT + IW + 6} y2={TOP + i * FRET_H}
            strokeWidth={1}
            className="stroke-gray-300 dark:stroke-gray-600"
          />
        ))}

        {/* Note dots with interval labels */}
        {strings.map((s, i) => {
          const isRoot = i === rootIndex;
          return (
            <g key={i}>
              <circle
                cx={cx(i)} cy={dotY(rowOf(frets[i]))} r={DOT_R}
                className={isRoot ? "fill-indigo-500" : "fill-gray-800 dark:fill-gray-100"}
              />
              <text
                x={cx(i)} y={dotY(rowOf(frets[i])) + 3}
                textAnchor="middle" fontSize={9} fontWeight="bold"
                className={isRoot ? "fill-white" : "fill-white dark:fill-gray-900"}
              >
                {intervals[i]}
              </text>
            </g>
          );
        })}

        {/* String note labels */}
        {strings.map((s, i) => (
          <text
            key={i}
            x={cx(i)} y={bottom + 14}
            textAnchor="middle" fontSize={9}
            className="fill-gray-500 dark:fill-gray-400"
          >
            {STRING_NOTES[s]}
          </text>
        ))}
      </svg>
    </button>
  );
}
