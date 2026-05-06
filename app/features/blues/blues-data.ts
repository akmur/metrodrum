export const BLUES_KEYS = ["E", "A", "D", "G", "C"] as const;
export type BluesKey = (typeof BLUES_KEYS)[number];

export type BluesDegree = "I7" | "IV7" | "V7";

/** Standard 12-bar blues progression */
export const PROGRESSION: BluesDegree[] = [
  "I7",  "I7",  "I7",  "I7",
  "IV7", "IV7", "I7",  "I7",
  "V7",  "IV7", "I7",  "V7",
];

/** Chord name for each degree in each key */
export const BLUES_CHORDS: Record<BluesKey, Record<BluesDegree, string>> = {
  E: { I7: "E7",  IV7: "A7", V7: "B7" },
  A: { I7: "A7",  IV7: "D7", V7: "E7" },
  D: { I7: "D7",  IV7: "G7", V7: "A7" },
  G: { I7: "G7",  IV7: "C7", V7: "D7" },
  C: { I7: "C7",  IV7: "F7", V7: "G7" },
};

export const DEGREE_COLORS: Record<BluesDegree, string> = {
  I7:  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700",
  IV7: "bg-amber-100  dark:bg-amber-900/40  text-amber-800  dark:text-amber-200  border-amber-200  dark:border-amber-700",
  V7:  "bg-rose-100   dark:bg-rose-900/40   text-rose-800   dark:text-rose-200   border-rose-200   dark:border-rose-700",
};

export const DEGREE_BADGE_COLORS: Record<BluesDegree, string> = {
  I7:  "bg-indigo-500",
  IV7: "bg-amber-500",
  V7:  "bg-rose-500",
};
