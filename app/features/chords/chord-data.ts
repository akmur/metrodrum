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
export const QUALITIES = ["maj", "min", "7", "maj7", "m7", "dim", "aug", "sus2", "sus4"] as const;
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
    name: "B",
    root: "B",
    quality: "maj",
    frets:   [-1, 2, 4, 4, 4, 2],
    fingers: [ 0, 1, 3, 3, 3, 1],
  },
  {
    name: "Bm",
    root: "B",
    quality: "min",
    frets:   [-1, 2, 4, 4, 3, 2],
    fingers: [ 0, 1, 3, 4, 2, 1],
  },
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
    name: "Cm",
    root: "C",
    quality: "min",
    frets:   [-1, 3, 5, 5, 4, 3],
    fingers: [ 0, 1, 3, 4, 2, 1],
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
    name: "Esus2",
    root: "E",
    quality: "sus2",
    frets:   [0, 2, 4, 4, 0, 0],
    fingers: [0, 1, 3, 4, 0, 0],
  },
  {
    name: "Esus4",
    root: "E",
    quality: "sus4",
    frets:   [0, 2, 2, 2, 0, 0],
    fingers: [0, 1, 2, 3, 0, 0],
  },
  {
    name: "E7",
    root: "E",
    quality: "7",
    frets:   [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
  },
  // ── F ──────────────────────────────────────────────
  {
    name: "F",
    root: "F",
    quality: "maj",
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
  },
  {
    name: "Fm",
    root: "F",
    quality: "min",
    frets:   [1, 3, 3, 1, 1, 1],
    fingers: [1, 3, 4, 1, 1, 1],
  },
  {
    name: "F7",
    root: "F",
    quality: "7",
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
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
    name: "Gm",
    root: "G",
    quality: "min",
    frets:   [3, 1, 0, 0, 3, 3],
    fingers: [2, 1, 0, 0, 3, 4],
  },
  {
    name: "Gsus2",
    root: "G",
    quality: "sus2",
    frets:   [3, 0, 0, 0, 3, 3],
    fingers: [2, 0, 0, 0, 3, 4],
  },
  {
    name: "Gsus4",
    root: "G",
    quality: "sus4",
    frets:   [3, 3, 0, 0, 1, 3],
    fingers: [3, 4, 0, 0, 1, 3],
  },
  {
    name: "G7",
    root: "G",
    quality: "7",
    frets:   [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
  },

  // ── maj7 ───────────────────────────────────────────
  {
    name: "Amaj7",
    root: "A",
    quality: "maj7",
    frets:   [-1, 0, 2, 1, 2, 0],
    fingers: [ 0, 0, 3, 1, 4, 0],
  },
  {
    name: "Bmaj7",
    root: "B",
    quality: "maj7",
    frets:   [-1, 2, 4, 3, 4, 2],
    fingers: [ 0, 1, 3, 2, 4, 1],
  },
  {
    name: "Cmaj7",
    root: "C",
    quality: "maj7",
    frets:   [-1, 3, 2, 0, 0, 0],
    fingers: [ 0, 3, 2, 0, 0, 0],
  },
  {
    name: "Dmaj7",
    root: "D",
    quality: "maj7",
    frets:   [-1, -1, 0, 2, 2, 2],
    fingers: [  0,  0, 0, 1, 2, 3],
  },
  {
    name: "Emaj7",
    root: "E",
    quality: "maj7",
    frets:   [0, 2, 1, 1, 0, 0],
    fingers: [0, 3, 1, 2, 0, 0],
  },
  {
    name: "Fmaj7",
    root: "F",
    quality: "maj7",
    frets:   [-1, -1, 3, 2, 1, 0],
    fingers: [  0,  0, 3, 2, 1, 0],
  },
  {
    name: "Gmaj7",
    root: "G",
    quality: "maj7",
    frets:   [3, 2, 0, 0, 0, 2],
    fingers: [3, 2, 0, 0, 0, 1],
  },

  // ── m7 ─────────────────────────────────────────────
  {
    name: "Am7",
    root: "A",
    quality: "m7",
    frets:   [-1, 0, 2, 0, 1, 0],
    fingers: [ 0, 0, 2, 0, 1, 0],
  },
  {
    name: "Bm7",
    root: "B",
    quality: "m7",
    frets:   [-1, 2, 0, 2, 0, 2],
    fingers: [ 0, 1, 0, 2, 0, 3],
  },
  {
    name: "Cm7",
    root: "C",
    quality: "m7",
    frets:   [-1, 3, 5, 3, 4, 3],
    fingers: [ 0, 1, 3, 1, 2, 1],
  },
  {
    name: "Dm7",
    root: "D",
    quality: "m7",
    frets:   [-1, -1, 0, 2, 1, 1],
    fingers: [  0,  0, 0, 2, 1, 1],
  },
  {
    name: "Em7",
    root: "E",
    quality: "m7",
    frets:   [0, 2, 0, 0, 0, 0],
    fingers: [0, 1, 0, 0, 0, 0],
  },
  {
    name: "Fm7",
    root: "F",
    quality: "m7",
    frets:   [-1, -1, 3, 1, 1, 1],
    fingers: [  0,  0, 3, 1, 1, 1],
  },
  {
    name: "Gm7",
    root: "G",
    quality: "m7",
    frets:   [-1, 1, 3, 3, 3, 3],
    fingers: [ 0, 1, 3, 3, 3, 3],
  },

  // ── dim ────────────────────────────────────────────
  {
    name: "Adim",
    root: "A",
    quality: "dim",
    frets:   [-1, 0, 1, 2, 1, -1],
    fingers: [ 0, 0, 1, 3, 2,  0],
  },
  {
    name: "Bdim",
    root: "B",
    quality: "dim",
    frets:   [-1, 2, 3, 4, 3, 2],
    fingers: [ 0, 1, 2, 4, 3, 1],
  },
  {
    name: "Cdim",
    root: "C",
    quality: "dim",
    frets:   [-1, 3, 4, 5, 4, 3],
    fingers: [ 0, 1, 2, 4, 3, 1],
  },
  {
    name: "Ddim",
    root: "D",
    quality: "dim",
    frets:   [-1, -1, 0, 1, 3, 1],
    fingers: [  0,  0, 0, 1, 3, 1],
  },
  {
    name: "Edim",
    root: "E",
    quality: "dim",
    frets:   [0, 1, 2, 3, 2, 0],
    fingers: [0, 1, 2, 4, 3, 0],
  },
  {
    name: "Fdim",
    root: "F",
    quality: "dim",
    frets:   [-1, -1, 3, 1, 0, 1],
    fingers: [  0,  0, 3, 1, 0, 2],
  },
  {
    name: "Gdim",
    root: "G",
    quality: "dim",
    frets:   [3, 1, 2, 3, 2, 3],
    fingers: [2, 1, 2, 3, 2, 3],
  },

  // ── aug ────────────────────────────────────────────
  {
    name: "Aaug",
    root: "A",
    quality: "aug",
    frets:   [-1, 0, 3, 2, 2, 1],
    fingers: [ 0, 0, 4, 2, 3, 1],
  },
  {
    name: "Baug",
    root: "B",
    quality: "aug",
    frets:   [-1, 2, 1, 0, 0, -1],
    fingers: [ 0, 2, 1, 0, 0,  0],
  },
  {
    name: "Caug",
    root: "C",
    quality: "aug",
    frets:   [-1, 3, 2, 1, 1, 0],
    fingers: [ 0, 4, 3, 1, 2, 0],
  },
  {
    name: "Daug",
    root: "D",
    quality: "aug",
    frets:   [-1, -1, 0, 3, 3, 2],
    fingers: [  0,  0, 0, 2, 3, 1],
  },
  {
    name: "Eaug",
    root: "E",
    quality: "aug",
    frets:   [0, 3, 2, 1, 1, 0],
    fingers: [0, 4, 3, 1, 2, 0],
  },
  {
    name: "Faug",
    root: "F",
    quality: "aug",
    frets:   [-1, -1, 3, 2, 2, 1],
    fingers: [  0,  0, 4, 2, 3, 1],
  },
  {
    name: "Gaug",
    root: "G",
    quality: "aug",
    frets:   [3, 2, 1, 0, 0, 3],
    fingers: [3, 2, 1, 0, 0, 4],
  },
];
