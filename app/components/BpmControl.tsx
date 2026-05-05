import { useState, useRef, useEffect } from "react";

interface BpmControlProps {
  bpm: number;
  min?: number;
  max?: number;
  onBpmChange: (bpm: number) => void;
  onTapTempo: () => void;
}

export default function BpmControl({
  bpm,
  min = 40,
  max = 240,
  onBpmChange,
  onTapTempo,
}: BpmControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(bpm));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(bpm));
    }
  }, [bpm, isEditing]);

  const handleDisplayClick = () => {
    setIsEditing(true);
    setEditValue(String(bpm));
  };

  const handleInputBlur = () => {
    const value = Number(editValue);
    if (!isNaN(value)) {
      onBpmChange(value);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setEditValue(String(bpm));
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Tempo (BPM)
      </label>

      {/* BPM display with −/+ buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onBpmChange(Math.max(min, bpm - 1))}
          aria-label="Decrease BPM"
          className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
        >
          −
        </button>

        <div className="w-28 text-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 text-center w-full focus:outline-none"
              aria-label="BPM value"
            />
          ) : (
            <output
              onClick={handleDisplayClick}
              aria-live="polite"
              className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleDisplayClick();
                }
              }}
            >
              {bpm}
            </output>
          )}
        </div>

        <button
          onClick={() => onBpmChange(Math.min(max, bpm + 1))}
          aria-label="Increase BPM"
          className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={bpm}
        onChange={(e) => onBpmChange(Number(e.target.value))}
        className="w-full accent-blue-500"
        aria-label="BPM slider"
      />

      <button
        onClick={onTapTempo}
        className="rounded-lg bg-purple-500 px-6 py-2 font-medium text-white transition-colors hover:bg-purple-600 active:scale-95"
        aria-label="Tap tempo"
      >
        Tap Tempo
      </button>
    </div>
  );
}
