import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("metronome", "routes/metronome.tsx"),
    route("midi", "routes/midi.tsx"),
  ]),
] satisfies RouteConfig;
