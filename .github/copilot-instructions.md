# MetroDrum — Copilot Instructions

MetroDrum is a browser-based metronome and MIDI drum player built with React Router v7 (framework mode), React 19, TypeScript, Tailwind CSS v4, and Tone.js.

## Commands

```bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build
npm run typecheck    # react-router typegen + tsc
npm run test:e2e     # Playwright e2e tests (auto-starts Vite on port 5199)

# Run a single test file or test by name
npx playwright test tests/e2e/metronome.spec.ts
npx playwright test -g "BPM slider updates"
```

Only Playwright e2e tests exist — no unit test runner is configured.

## Architecture

### Route structure

```
app/routes.ts
└── Layout (components/Layout.tsx)
    ├── / → home.tsx  (redirects to /metronome)
    ├── /metronome → features/metronome/Metronome.tsx
    └── /midi       → features/midi/MidiPlayer.tsx
```

All routes share a single layout with a `Navbar`. Feature-specific logic lives in `app/features/`, not directly in route files.

### Provider tree (root.tsx)

```
ThemeProvider
  └── AudioProvider
        └── <Outlet />
```

- **`AudioProvider`** — manages the Tone.js `AudioContext` and a master `Volume` node. Must call `startAudio()` before any sound plays (browser autoplay policy). Call `Tone.getContext()` before `Tone.start()` to avoid operating on Tone's inert `DummyContext`.
- **`ThemeProvider`** — light/dark theme persisted to `localStorage` under the key `"metrodrum-theme"`. Applies the theme as both a class and `data-theme` attribute on `<html>`.

### Hooks

`app/hooks/useMetronome.ts` owns all metronome state and Tone.js lifecycle (BPM, subdivision, sound preset, play/stop, tap tempo). The `Metronome` feature component is purely presentational — it consumes this hook. BPM is clamped to 40–240.

### MIDI Player

`app/features/midi/MidiPlayer.tsx` is a self-contained component (no dedicated hook). All MIDI tracks are currently forced to the drum/percussion path (sample-based `DrumKit`). BPM tempo-stretching uses the formula:

```ts
transport.bpm.value = (bpm / originalBpmRef.current) * 120;
```

because Tone.js MIDI note times are in seconds at the file's original tempo and Transport BPM 120 = 1:1 playback speed.

### Virtual module: `virtual:midi-manifest`

A custom Vite plugin in `vite.config.ts` reads `public/samples/midi/` at build/dev time and exports its filenames:

```ts
import { midiPresets } from "virtual:midi-manifest";
```

To add bundled MIDI presets, drop `.mid`/`.midi` files into `public/samples/midi/`. The manifest updates on HMR automatically. The TypeScript type declaration lives in `app/types/midi-manifest.d.ts`.

## Key Conventions

- **Path alias**: `@/` resolves to `app/` (via `vite-tsconfig-paths` + `tsconfig.json`).
- **Tone.js cleanup**: Always dispose `Tone.Loop`, `Tone.Part`, and synth/sampler nodes on component unmount or before re-creating them. Wrap dispose calls in `try/catch` since nodes can be disposed mid-cleanup.
- **Audio initialization gate**: Every play action checks `isAudioStarted` from `useAudio()` and calls `startAudio()` if needed before starting Tone.js transport.
- **Spacebar shortcut**: Both the Metronome and MIDI Player bind `Space` to toggle play/stop via `window.addEventListener("keydown", ...)`, skipping the handler when focus is on an `<input>` or `<select>`.
- **Accessibility**: Interactive controls use `role="radio"` + `aria-checked` for segmented button groups, `role="group"` for the beat indicator, and descriptive `aria-label` attributes. Playwright tests query by ARIA roles — keep these attributes accurate.
- **Tailwind dark mode**: Dark variants are applied inline (`dark:bg-gray-800`) using class-based dark mode toggled by `ThemeProvider`.
