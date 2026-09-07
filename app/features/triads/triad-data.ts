// Triad shapes: maj, min, dim, aug triads as movable shapes.
// Each shape is a closed voicing on 3 adjacent strings, normalized so the
// lowest note sits at the 1st fret. Shapes are root-independent (movable).

export const STRING_NOTES = ["E", "A", "D", "G", "B", "e"] as const;
const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const; // low E → high e

export type Quality = "maj" | "min" | "dim" | "aug";
export const QUALITIES: Quality[] = ["maj", "min", "dim", "aug"];
export const QUALITY_LABELS: Record<Quality, string> = {
  maj: "Major",
  min: "Minor",
  dim: "Diminished",
  aug: "Augmented",
};

// [third, fifth] intervals in semitones above the root.
const INTERVALS: Record<Quality, [number, number]> = {
  maj: [4, 7],
  min: [3, 7],
  dim: [3, 6],
  aug: [4, 8],
};

export type IntervalLabel = "R" | "3" | "♭3" | "5" | "♭5" | "♯5";

// [root, third, fifth] labels per quality.
const INTERVAL_LABELS: Record<Quality, [IntervalLabel, IntervalLabel, IntervalLabel]> = {
  maj: ["R", "3", "5"],
  min: ["R", "♭3", "5"],
  dim: ["R", "♭3", "♭5"],
  aug: ["R", "3", "♯5"],
};

export type Inversion = "Root position" | "1st inversion" | "2nd inversion";

export interface TriadShape {
  quality: Quality;
  inversion: Inversion;
  // three string indices (ascending pitch), low → high
  strings: [number, number, number];
  // fret numbers (≥ 1), normalized to the 1st-fret position
  frets: [number, number, number];
  // interval label for each of the three strings
  intervals: [IntervalLabel, IntervalLabel, IntervalLabel];
  // index (0-2) of the string within the group that carries the root
  rootIndex: number;
}

// Adjacent 3-string groups, low → high (E A D G B e).
// EAD and ADG share the same shape (both have 5-semitone gaps), hence grouped.
export const STRING_SETS = [
  { label: "EAD/ADG", strings: [0, 1, 2] as const },
  { label: "DGB", strings: [2, 3, 4] as const },
  { label: "GBE", strings: [3, 4, 5] as const },
] as const;

export type StringSetLabel = (typeof STRING_SETS)[number]["label"];

function buildShapes(quality: Quality): TriadShape[] {
  const [third, fifth] = INTERVALS[quality];
  const [rootLabel, thirdLabel, fifthLabel] = INTERVAL_LABELS[quality];

  const inversions: Array<{
    label: Inversion;
    notes: [number, number, number];
    intervals: [IntervalLabel, IntervalLabel, IntervalLabel];
    rootIndex: number;
  }> = [
    {
      label: "Root position",
      notes: [0, third, fifth],
      intervals: [rootLabel, thirdLabel, fifthLabel],
      rootIndex: 0,
    },
    {
      label: "1st inversion",
      notes: [third, fifth, 12],
      intervals: [thirdLabel, fifthLabel, rootLabel],
      rootIndex: 2,
    },
    {
      label: "2nd inversion",
      notes: [fifth, 12, third + 12],
      intervals: [fifthLabel, rootLabel, thirdLabel],
      rootIndex: 1,
    },
  ];

  const shapes: TriadShape[] = [];
  for (const inv of inversions) {
    for (const set of STRING_SETS) {
      const strings = [...set.strings] as [number, number, number];
      const opens = [OPEN_MIDI[strings[0]], OPEN_MIDI[strings[1]], OPEN_MIDI[strings[2]]];
      const raw = inv.notes.map((n, k) => n - opens[k]);
      const min = Math.min(...raw);
      const frets = raw.map(f => f - min + 1) as [number, number, number];
      shapes.push({
        quality,
        inversion: inv.label,
        strings,
        frets,
        intervals: inv.intervals,
        rootIndex: inv.rootIndex,
      });
    }
  }
  return shapes;
}

export const SHAPES: TriadShape[] = QUALITIES.flatMap(buildShapes);
