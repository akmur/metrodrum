import { useMetronome, type Beats, type NoteValue, type SoundPreset } from "@/hooks/useMetronome";
import { useEffect } from "react";
import BpmControl from "@/components/BpmControl";

const BEAT_OPTIONS: Beats[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
const NOTE_VALUE_OPTIONS: NoteValue[] = [2, 4, 8];
const SOUND_PRESETS: { value: SoundPreset; label: string }[] = [
  { value: "click", label: "Click" },
  { value: "beep", label: "Beep" },
  { value: "sticks", label: "Sticks" },
];

export default function Metronome() {
  const {
    bpm,
    beats,
    noteValue,
    soundPreset,
    accentEnabled,
    isPlaying,
    currentBeat,
    setBpm,
    setBeats,
    setNoteValue,
    setSoundPreset,
    setAccentEnabled,
    toggle,
    tapTempo,
  } = useMetronome();

  // Spacebar to toggle metronome
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-7">

        {/* Beat indicators */}
        <div className="flex gap-3 h-12 items-center" role="group" aria-label="Beat indicator">
          {Array.from({ length: beats }, (_, i) => {
            const isActive = currentBeat === i;
            const isAccentBeat = i === 0 && accentEnabled;
            return (
              <div
                key={i}
                role="status"
                aria-label={`Beat ${i + 1}${isActive ? " active" : ""}`}
                className={`rounded-full transition-all duration-75 ${
                  isActive
                    ? isAccentBeat
                      ? "h-10 w-10 bg-red-500 shadow-lg shadow-red-500/50"
                      : "h-10 w-10 bg-blue-500 shadow-lg shadow-blue-500/50"
                    : "h-7 w-7 bg-gray-200 dark:bg-gray-600"
                }`}
              />
            );
          })}
        </div>

        <div className="w-full border-t border-gray-100 dark:border-gray-700" />

        {/* Two-column middle section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">

          {/* Left: BPM + Tap Tempo */}
          <BpmControl
            bpm={bpm}
            min={40}
            max={240}
            onBpmChange={setBpm}
            onTapTempo={tapTempo}
          />

          {/* Divider: horizontal on mobile, vertical on desktop */}
          <div className="w-full h-px bg-gray-100 dark:bg-gray-700 md:w-px md:h-auto md:self-stretch" />

          {/* Right: Sound + Time Signature */}
          <div className="flex flex-col gap-5">
            {/* Sound */}
            <fieldset className="flex flex-col items-center gap-2">
              <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Sound
              </legend>
              <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label="Sound preset">
                {SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    role="radio"
                    aria-checked={soundPreset === preset.value}
                    onClick={() => setSoundPreset(preset.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                      soundPreset === preset.value
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={accentEnabled}
                  onChange={(e) => setAccentEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 accent-purple-500 cursor-pointer"
                />
                Accent on beat 1
              </label>
            </fieldset>

            <div className="w-full border-t border-gray-100 dark:border-gray-700" />

            {/* Time Signature */}
            <fieldset className="flex flex-col items-center gap-2">
              <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Time Signature
              </legend>
              <div className="flex items-center gap-2">
                <select
                  value={beats}
                  onChange={(e) => setBeats(Number(e.target.value) as Beats)}
                  aria-label="Beats per measure"
                  className="rounded-xl border border-blue-300 dark:border-blue-500 bg-white dark:bg-gray-800 px-3 py-2 text-lg font-semibold text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {BEAT_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <span className="text-2xl font-light text-gray-400">/</span>
                <select
                  value={noteValue}
                  onChange={(e) => setNoteValue(Number(e.target.value) as NoteValue)}
                  aria-label="Note value"
                  className="rounded-xl border border-blue-300 dark:border-blue-500 bg-white dark:bg-gray-800 px-3 py-2 text-lg font-semibold text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {NOTE_VALUE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </fieldset>
          </div>
        </div>

        <div className="w-full border-t border-gray-100 dark:border-gray-700" />

        {/* Start/Stop */}
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
          className={`w-full rounded-2xl py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
              : "bg-green-500 hover:bg-green-600 shadow-green-500/30"
          }`}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>

      </div>
    </div>
  );
}

