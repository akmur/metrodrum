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

export const POSITIONS = [1, 5, 9] as const;
export type Position = (typeof POSITIONS)[number];
export const POSITION_LABELS: Record<Position, string> = { 1: "I", 5: "V", 9: "IX" };

/** Find the fret nearest to `target` (≥ 1) for a given pitch class on a string. */
function nearestFret(openMidi: number, pitchClass: number, target: number): number {
  const base = (pitchClass - openMidi % 12 + 12) % 12;
  let best = base >= 1 ? base : base + 12;
  let bestDist = Math.abs(best - target);
  for (let k = -1; k <= 4; k++) {
    const f = base + k * 12;
    if (f < 1) continue;
    const d = Math.abs(f - target);
    if (d < bestDist) { bestDist = d; best = f; }
  }
  return best;
}

/** Build frets for a shape given a fixed root fret; returns null if span > 4. */
function buildShape(
  rootFret: number,
  rootStringIdx: number,
  openMidi: readonly [number, number, number],
  rootIdx: number,
  intervals: readonly [number, number, number],
  order: readonly [number, number, number],
): [number, number, number] | null {
  const frets = openMidi.map((open, i) => {
    if (i === rootStringIdx) return rootFret;
    const pc = (rootIdx + intervals[order[i]]) % 12;
    return nearestFret(open, pc, rootFret);
  }) as [number, number, number];
  const span = Math.max(...frets) - Math.min(...frets);
  return span <= 4 ? frets : null;
}

export function computeTriadShape(
  rootIdx: number,
  quality: Quality,
  inversion: Inversion,
  group: StringGroup,
  targetRootFret = 1,
): TriadShape {
  const intervals = QUALITY_INTERVALS[quality];
  const order = INVERSION_ORDER[inversion];
  const openMidi = STRING_GROUP_MIDI[group];

  // Which string carries the root note in this inversion?
  const rootStringIdx = order.indexOf(0);
  const rootPc = rootIdx % 12;

  // Candidate root frets sorted by distance to target
  const base = (rootPc - openMidi[rootStringIdx] % 12 + 12) % 12;
  const candidates = [-1, 0, 1, 2, 3, 4]
    .map(k => base + k * 12)
    .filter(f => f >= 1)
    .sort((a, b) => Math.abs(a - targetRootFret) - Math.abs(b - targetRootFret));

  for (const rf of candidates) {
    const result = buildShape(rf, rootStringIdx, openMidi, rootIdx, intervals, order);
    if (result) {
      const midiNotes = openMidi.map((o, i) => o + result[i]) as [number, number, number];
      const minFret = Math.min(...result);
      const startFret = minFret === 0 ? 1 : minFret;
      return { rootName: ALL_ROOTS[rootIdx], rootIdx, quality, inversion, group, frets: result, midiNotes, startFret };
    }
  }

  // Ultimate fallback: original minimum-span algorithm
  const baseFrets = openMidi.map((open, i) => {
    const targetPc = (rootIdx + intervals[order[i]]) % 12;
    const openPc = open % 12;
    return (targetPc - openPc + 12) % 12;
  }) as [number, number, number];
  const frets = findBestFrets(baseFrets);
  const midiNotes = openMidi.map((open, i) => open + frets[i]) as [number, number, number];
  const minFret = Math.min(...frets);
  const startFret = minFret === 0 ? 1 : minFret;
  return { rootName: ALL_ROOTS[rootIdx], rootIdx, quality, inversion, group, frets, midiNotes, startFret };
}

/** Pre-compute all shapes for quick lookup */
export function computeAllShapes(
  group: StringGroup,
  quality: Quality,
  targetRootFret = 1,
): TriadShape[][] {
  return ALL_ROOTS.map((rootName, rootIdx) =>
    INVERSIONS.map(inv => computeTriadShape(rootIdx, quality, inv, group, targetRootFret)),
  );
}
