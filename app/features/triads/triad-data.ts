// Triads: maj, min, dim, aug for all 12 roots, in all closed positions
// (3 adjacent-string sets × root / 1st / 2nd inversion) within 12 frets.

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

export const ROOTS = [
  "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#",
] as const;
export type Root = (typeof ROOTS)[number];

const ROOT_PC: Record<Root, number> = {
  A: 9, "A#": 10, B: 11, C: 0, "C#": 1, D: 2, "D#": 3,
  E: 4, F: 5, "F#": 6, G: 7, "G#": 8,
};

// [third, fifth] intervals (semitones above root)
const INTERVALS: Record<Quality, [number, number]> = {
  maj: [4, 7],
  min: [3, 7],
  dim: [3, 6],
  aug: [4, 8],
};

const MAX_FRET = 12;

export type Inversion = "Root position" | "1st inversion" | "2nd inversion";

export interface TriadPosition {
  inversion: Inversion;
  // three string indices (ascending pitch), low → high
  strings: [number, number, number];
  // matching fret numbers (0 = open)
  frets: [number, number, number];
  // which of the three strings carries the root (for highlighting)
  rootString: number;
}

export interface TriadDef {
  name: string;
  root: Root;
  quality: Quality;
  positions: TriadPosition[];
}

const SUFFIX: Record<Quality, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
};

function buildPositions(root: Root, quality: Quality): TriadPosition[] {
  const rootPC = ROOT_PC[root];
  const [thirdInt, fifthInt] = INTERVALS[quality];

  // Stacked chord tones (root lowest), octave-adjusted for each inversion.
  const inversions: Array<{
    label: Inversion;
    notes: [number, number, number];
    rootIndex: number;
  }> = [
    { label: "Root position", notes: [rootPC, rootPC + thirdInt, rootPC + fifthInt], rootIndex: 0 },
    { label: "1st inversion", notes: [rootPC + thirdInt, rootPC + fifthInt, rootPC + 12], rootIndex: 2 },
    { label: "2nd inversion", notes: [rootPC + fifthInt, rootPC + 12, rootPC + thirdInt + 12], rootIndex: 1 },
  ];

  const positions: TriadPosition[] = [];

  for (const inv of inversions) {
    for (let si = 0; si < 4; si++) {
      const opens = [OPEN_MIDI[si], OPEN_MIDI[si + 1], OPEN_MIDI[si + 2]];
      const baseFrets = inv.notes.map((n, k) => n - opens[k]);
      const minBase = Math.min(...baseFrets);
      const shift = Math.ceil(-minBase / 12) * 12;
      const frets = baseFrets.map(f => f + shift) as [number, number, number];

      if (frets.some(f => f < 0 || f > MAX_FRET)) continue;

      const strings = [si, si + 1, si + 2] as [number, number, number];
      positions.push({
        inversion: inv.label,
        strings,
        frets,
        rootString: strings[inv.rootIndex],
      });
    }
  }

  return positions;
}

export const TRIADS: TriadDef[] = ROOTS.flatMap(root =>
  QUALITIES.map(quality => ({
    name: `${root}${SUFFIX[quality]}`,
    root,
    quality,
    positions: buildPositions(root, quality),
  }))
);
