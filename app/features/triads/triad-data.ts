export const ALL_ROOTS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type RootName = (typeof ALL_ROOTS)[number];

export const QUALITIES = ["maj", "min", "dim", "aug"] as const;
export type Quality = (typeof QUALITIES)[number];

export const QUALITY_LABELS: Record<Quality, string> = {
  maj: "Major",
  min: "Minor",
  dim: "Dim",
  aug: "Aug",
};

// [root, third, fifth] semitone intervals from root
export const QUALITY_INTERVALS: Record<Quality, readonly [number, number, number]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

export const INVERSIONS = ["root", "first", "second"] as const;
export type Inversion = (typeof INVERSIONS)[number];

export const INVERSION_LABELS: Record<Inversion, string> = {
  root: "Root",
  first: "1st inv",
  second: "2nd inv",
};

// Which degree (0=root, 1=3rd, 2=5th) goes on each string, low→high
export const INVERSION_ORDER: Record<Inversion, readonly [number, number, number]> = {
  root:   [0, 1, 2],
  first:  [1, 2, 0],
  second: [2, 0, 1],
};

export const STRING_GROUPS = ["EAD", "ADG", "DGB", "GBe"] as const;
export type StringGroup = (typeof STRING_GROUPS)[number];

// Open MIDI notes: [lowest string, middle string, highest string]
export const STRING_GROUP_MIDI: Record<StringGroup, readonly [number, number, number]> = {
  EAD: [40, 45, 50],
  ADG: [45, 50, 55],
  DGB: [50, 55, 59],
  GBe: [55, 59, 64],
};

export const STRING_GROUP_LABELS: Record<StringGroup, string> = {
  EAD: "E · A · D",
  ADG: "A · D · G",
  DGB: "D · G · B",
  GBe: "G · B · e",
};

export interface TriadShape {
  rootName: RootName;
  rootIdx: number;
  quality: Quality;
  inversion: Inversion;
  group: StringGroup;
  /** frets[0] = lowest string, frets[2] = highest. -1 not used (all 3 strings always fretted) */
  frets: readonly [number, number, number];
  midiNotes: readonly [number, number, number];
  /** Lowest fret shown in diagram (1 = nut visible, >1 = fret indicator shown) */
  startFret: number;
}

/**
 * For each string find the lowest fret for a given pitch class,
 * then try all 2³ octave-shift combinations to minimise the fret span.
 */
function findBestFrets(baseFrets: [number, number, number]): [number, number, number] {
  let best: [number, number, number] = [...baseFrets] as [number, number, number];
  let bestSpan = Math.max(...best) - Math.min(...best);

  for (let mask = 1; mask < 8; mask++) {
    const candidate = baseFrets.map(
      (f, i) => f + (((mask >> i) & 1) * 12),
    ) as [number, number, number];
    const span = Math.max(...candidate) - Math.min(...candidate);
    if (
      span < bestSpan ||
      (span === bestSpan && Math.max(...candidate) < Math.max(...best))
    ) {
      bestSpan = span;
      best = candidate;
    }
  }
  return best;
}

export function computeTriadShape(
  rootIdx: number,
  quality: Quality,
  inversion: Inversion,
  group: StringGroup,
): TriadShape {
  const intervals = QUALITY_INTERVALS[quality];
  const order = INVERSION_ORDER[inversion];
  const openMidi = STRING_GROUP_MIDI[group];

  const baseFrets = openMidi.map((open, i) => {
    const targetPc = (rootIdx + intervals[order[i]]) % 12;
    const openPc = open % 12;
    return (targetPc - openPc + 12) % 12;
  }) as [number, number, number];

  const frets = findBestFrets(baseFrets);
  const midiNotes = openMidi.map((open, i) => open + frets[i]) as [number, number, number];
  const minFret = Math.min(...frets);
  const startFret = minFret === 0 ? 1 : minFret;

  return {
    rootName: ALL_ROOTS[rootIdx],
    rootIdx,
    quality,
    inversion,
    group,
    frets,
    midiNotes,
    startFret,
  };
}

/** Pre-compute all shapes for quick lookup */
export function computeAllShapes(
  group: StringGroup,
  quality: Quality,
): TriadShape[][] {
  // Returns array indexed by rootIdx, each containing [root, first, second] inversions
  return ALL_ROOTS.map((rootName, rootIdx) =>
    INVERSIONS.map(inv => computeTriadShape(rootIdx, quality, inv, group)),
  );
}
