import { useMetronome, type Subdivision, type SoundPreset } from "@/hooks/useMetronome";
import { useEffect } from "react";
import BpmControl from "@/components/BpmControl";

const SUBDIVISIONS: Subdivision[] = [3, 4, 6];
const SOUND_PRESETS: { value: SoundPreset; label: string }[] = [
  { value: "click", label: "Click" },
  { value: "beep", label: "Beep" },
  { value: "tick", label: "Tick" },
];

export default function Metronome() {
  const {
    bpm,
    subdivision,
    soundPreset,
    isPlaying,
    currentBeat,
    setBpm,
    setSubdivision,
    setSoundPreset,
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
    <div className="flex flex-col items-center gap-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Metronome
      </h1>

      {/* Beat indicator */}
      <div className="flex gap-3" role="group" aria-label="Beat indicator">
        {Array.from({ length: subdivision }, (_, i) => (
          <div
            key={i}
            role="status"
            aria-label={`Beat ${i + 1}${currentBeat === i ? " active" : ""}`}
            className={`h-6 w-6 rounded-full transition-all duration-100 ${
              currentBeat === i
                ? i === 0
                  ? "bg-red-500 scale-125"
                  : "bg-blue-500 scale-125"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* BPM control */}
      <BpmControl
        bpm={bpm}
        min={40}
        max={240}
        onBpmChange={setBpm}
        onTapTempo={tapTempo}
      />

      {/* Sound preset selector */}
      <fieldset className="flex flex-col items-center gap-2">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sound
        </legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Sound preset">
          {SOUND_PRESETS.map((preset) => (
            <button
              key={preset.value}
              role="radio"
              aria-checked={soundPreset === preset.value}
              onClick={() => setSoundPreset(preset.value)}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                soundPreset === preset.value
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Subdivision selector */}
      <fieldset className="flex flex-col items-center gap-2">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time Signature
        </legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Time signature">
          {SUBDIVISIONS.map((sub) => (
            <button
              key={sub}
              role="radio"
              aria-checked={subdivision === sub}
              onClick={() => setSubdivision(sub)}
              className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                subdivision === sub
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {sub}/4
            </button>
          ))}
        </div>
      </fieldset>

      {/* Play/Stop button */}
      <button
        onClick={toggle}
        aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
        className={`rounded-full px-8 py-4 text-lg font-bold text-white transition-colors ${
          isPlaying
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {isPlaying ? "Stop" : "Start"}
      </button>
    </div>
  );
}
