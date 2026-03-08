import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import * as Tone from "tone";

interface AudioContextState {
  isAudioStarted: boolean;
  masterVolume: number;
  startAudio: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
}

const AudioCtx = createContext<AudioContextState | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(75);
  const volumeNodeRef = useRef<Tone.Volume | null>(null);

  const startAudio = useCallback(async () => {
    if (isAudioStarted) return;
    // Ensure the real AudioContext is created before resuming.
    // Tone.js lazily creates it on first getContext() call;
    // without this, Tone.start() resumes the inert DummyContext.
    Tone.getContext();
    await Tone.start();
    const vol = new Tone.Volume(0).toDestination();
    volumeNodeRef.current = vol;
    setIsAudioStarted(true);
  }, [isAudioStarted]);

  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    if (volumeNodeRef.current) {
      const db = volume === 0 ? -Infinity : Tone.gainToDb(volume / 100);
      volumeNodeRef.current.volume.value = db;
    }
  }, []);

  return (
    <AudioCtx.Provider value={{ isAudioStarted, masterVolume, startAudio, setMasterVolume }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio(): AudioContextState {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
