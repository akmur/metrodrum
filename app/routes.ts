import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("metronome", "routes/metronome.tsx"),
    route("midi", "routes/midi.tsx"),
    route("fretboard", "routes/fretboard.tsx", [
      index("routes/fretboard.note.tsx"),
      route("fret", "routes/fretboard.fret.tsx"),
    ]),
    route("chords", "routes/chords.tsx"),
    route("triads", "routes/triads.tsx"),
    route("blues", "routes/blues.tsx"),
  ]),
] satisfies RouteConfig;
