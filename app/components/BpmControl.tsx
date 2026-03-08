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
    <div className="flex flex-col items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tempo (BPM)
      </label>
      
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
          className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white bg-transparent border-2 border-blue-500 rounded px-2 text-center w-32"
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

      <input
        type="range"
        min={min}
        max={max}
        value={bpm}
        onChange={(e) => onBpmChange(Number(e.target.value))}
        className="w-64 accent-blue-500"
        aria-label="BPM slider"
      />

      <button
        onClick={onTapTempo}
        className="rounded-lg bg-purple-500 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-600 active:scale-95"
        aria-label="Tap tempo"
      >
        Tap Tempo
      </button>
    </div>
  );
}
