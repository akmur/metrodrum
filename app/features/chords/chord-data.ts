// Guitar open string MIDI notes (low E → high e)
// E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
export const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64] as const;

export interface ChordDef {
  name: string;
  root: string;
  quality: string;
  // 6 values, index 0 = low E string
  // -1 = muted, 0 = open, 1-5 = fret number
  frets: readonly number[];
  // 6 values: 0 = no finger / open / muted, 1-4 = finger number
  fingers: readonly number[];
}

export const ROOTS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const QUALITIES = ["maj", "min", "7", "sus2", "sus4"] as const;
export type Root = (typeof ROOTS)[number];
export type Quality = (typeof QUALITIES)[number];

export const CHORDS: ChordDef[] = [
  // ── A ──────────────────────────────────────────────
  {
    name: "A",
    root: "A",
    quality: "maj",
    frets:   [-1, 0, 2, 2, 2, 0],
    fingers: [ 0, 0, 1, 2, 3, 0],
  },
  {
    name: "Am",
    root: "A",
    quality: "min",
    frets:   [-1, 0, 2, 2, 1, 0],
    fingers: [ 0, 0, 2, 3, 1, 0],
  },
  {
    name: "A7",
    root: "A",
    quality: "7",
    frets:   [-1, 0, 2, 0, 2, 0],
    fingers: [ 0, 0, 2, 0, 3, 0],
  },
  {
    name: "Asus2",
    root: "A",
    quality: "sus2",
    frets:   [-1, 0, 2, 2, 0, 0],
    fingers: [ 0, 0, 1, 2, 0, 0],
  },
  {
    name: "Asus4",
    root: "A",
    quality: "sus4",
    frets:   [-1, 0, 2, 2, 3, 0],
    fingers: [ 0, 0, 1, 2, 3, 0],
  },
  // ── B ──────────────────────────────────────────────
  {
    name: "B7",
    root: "B",
    quality: "7",
    frets:   [-1, 2, 1, 2, 0, 2],
    fingers: [ 0, 2, 1, 3, 0, 4],
  },
  // ── C ──────────────────────────────────────────────
  {
    name: "C",
    root: "C",
    quality: "maj",
    frets:   [-1, 3, 2, 0, 1, 0],
    fingers: [ 0, 3, 2, 0, 1, 0],
  },
  {
    name: "C7",
    root: "C",
    quality: "7",
    frets:   [-1, 3, 2, 3, 1, 0],
    fingers: [ 0, 3, 2, 4, 1, 0],
  },
  // ── D ──────────────────────────────────────────────
  {
    name: "D",
    root: "D",
    quality: "maj",
    frets:   [-1, -1, 0, 2, 3, 2],
    fingers: [ 0,  0, 0, 1, 3, 2],
  },
  {
    name: "Dm",
    root: "D",
    quality: "min",
    frets:   [-1, -1, 0, 2, 3, 1],
    fingers: [ 0,  0, 0, 2, 3, 1],
  },
  {
    name: "D7",
    root: "D",
    quality: "7",
    frets:   [-1, -1, 0, 2, 1, 2],
    fingers: [ 0,  0, 0, 2, 1, 3],
  },
  {
    name: "Dsus2",
    root: "D",
    quality: "sus2",
    frets:   [-1, -1, 0, 2, 3, 0],
    fingers: [ 0,  0, 0, 1, 3, 0],
  },
  {
    name: "Dsus4",
    root: "D",
    quality: "sus4",
    frets:   [-1, -1, 0, 2, 3, 3],
    fingers: [ 0,  0, 0, 1, 3, 4],
  },
  // ── E ──────────────────────────────────────────────
  {
    name: "E",
    root: "E",
    quality: "maj",
    frets:   [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
  },
  {
    name: "Em",
    root: "E",
    quality: "min",
    frets:   [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
  },
  {
    name: "E7",
    root: "E",
    quality: "7",
    frets:   [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
  },
  // ── G ──────────────────────────────────────────────
  {
    name: "G",
    root: "G",
    quality: "maj",
    frets:   [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
  },
  {
    name: "G7",
    root: "G",
    quality: "7",
    frets:   [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
  },
];
