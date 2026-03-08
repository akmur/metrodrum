import { useState, useCallback, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { useAudio } from "@/providers/AudioProvider";
import { midiPresets } from "virtual:midi-manifest";
import BpmControl from "@/components/BpmControl";
import {
  createDrumKit,
  createMelodicSynth,
  getInstrumentLabel,
  type DrumKit,
  type DisposableNode,
} from "./gm-sounds";

interface TrackInfo {
  name: string;
  instrument: string;
  noteCount: number;
  channel: number;
  percussion: boolean;
  muted: boolean;
}

export default function MidiPlayer() {
  const { isAudioStarted, startAudio } = useAudio();
  const [midiData, setMidiData] = useState<Midi | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(90);
  const originalBpmRef = useRef(120);
  const transpositionRef = useRef(0); // Semitones to transpose
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [fx, setFx] = useState({
    reverbWet: 0.4,
    reverbDecay: 2.5,
  });
  const fxRef = useRef(fx);
  fxRef.current = fx;

  const synthsRef = useRef<DisposableNode[]>([]);
  const drumKitRef = useRef<DrumKit | null>(null);
  const partsRef = useRef<Tone.Part[]>([]);
  const mutedRef = useRef<Set<number>>(new Set());
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.loop = false;
    transport.position = 0;
    partsRef.current.forEach((p) => { try { p.dispose(); } catch { /* already disposed */ } });
    synthsRef.current.forEach((s) => { try { s.dispose(); } catch { /* already disposed */ } });
    try { drumKitRef.current?.dispose(); } catch { /* already disposed */ }
    partsRef.current = [];
    synthsRef.current = [];
    drumKitRef.current = null;
  };

  const loadMidi = useCallback((midi: Midi, name: string) => {
    cleanup();
    setIsPlaying(false);

    setMidiData(midi);
    setFileName(name);

    let fileBpm = 120;
    // Try to extract BPM from filename first (e.g. "109BPM Basic Shuffle...")
    const match = name.match(/(\d+)\s*BPM/i);
    if (match) {
      fileBpm = Number(match[1]);
    } else if (midi.header.tempos.length > 0) {
      // Fallback to MIDI header tempo if not in filename
      fileBpm = Math.round(midi.header.tempos[0].bpm);
    }
    originalBpmRef.current = fileBpm;
    setBpm(fileBpm);

    // Calculate transposition to C major
    const keyMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    let transposition = 0;
    if (midi.header.keySignatures.length > 0) {
      const key = midi.header.keySignatures[0].key;
      const semitones = keyMap[key] ?? 0;
      // Transpose to C (0 semitones from C)
      transposition = -semitones;
    }
    transpositionRef.current = transposition;

    const trackInfos: TrackInfo[] = midi.tracks
      .filter((t) => t.notes.length > 0)
      .map((t) => ({
        name: t.name || `Ch ${t.channel + 1}`,
        instrument: getInstrumentLabel(t.instrument.number, true),
        noteCount: t.notes.length,
        channel: t.channel,
        percussion: true, // Force all tracks as drums
        muted: false,
      }));
    setTracks(trackInfos);
    mutedRef.current.clear();
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      loadMidi(midi, file.name);
      setSelectedPreset("");
    },
    [loadMidi]
  );

  const handlePresetSelect = useCallback(
    async (presetName: string) => {
      if (!presetName) return;
      setSelectedPreset(presetName);

      const response = await fetch(`/samples/midi/${presetName}`);
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      loadMidi(midi, presetName);
    },
    [loadMidi]
  );

  const reverbDecayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFx = useCallback(
    (key: keyof typeof fx, value: number) => {
      setFx((prev) => ({ ...prev, [key]: value }));
      const bus = drumKitRef.current;
      if (!bus) return;
      const e = bus.effects;
      try {
        switch (key) {
          case "reverbWet": e.reverb.wet.value = value; break;
          case "reverbDecay":
            // Debounce: generate() creates an OfflineContext and is async
            if (reverbDecayTimeout.current) clearTimeout(reverbDecayTimeout.current);
            reverbDecayTimeout.current = setTimeout(() => {
              try { e.reverb.decay = value; } catch { /* ignore during regeneration */ }
            }, 200);
            break;
        }
      } catch {
        // Effect node may have been disposed during cleanup
      }
    },
    []
  );

  const toggleMute = useCallback((index: number) => {
    setTracks((prev) =>
      prev.map((t, i) => {
        if (i === index) {
          const newMuted = !t.muted;
          if (newMuted) mutedRef.current.add(i);
          else mutedRef.current.delete(i);
          return { ...t, muted: newMuted };
        }
        return t;
      })
    );
  }, []);

  const handleBpmChange = useCallback((value: number) => {
    const clamped = Math.min(300, Math.max(20, value));
    setBpm(clamped);
    Tone.getTransport().bpm.value = (clamped / originalBpmRef.current) * 120;
  }, []);

  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    
    // Reset if last tap was more than 2 seconds ago
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    
    taps.push(now);
    
    // Keep only last 8 taps
    if (taps.length > 8) {
      taps.shift();
    }
    
    // Need at least 2 taps to calculate BPM
    if (taps.length >= 2) {
      // Calculate average interval between taps
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // Convert to BPM: 60000ms per minute / interval in ms
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }
  }, [handleBpmChange]);

  const play = useCallback(async () => {
    if (!midiData) return;

    if (!isAudioStarted) {
      await startAudio();
    }

    cleanup();

    const transport = Tone.getTransport();
    // MIDI note times are in seconds at the file's original tempo.
    // Transport BPM 120 = 1:1 time. Scale so the desired BPM is accurate.
    transport.bpm.value = (bpm / originalBpmRef.current) * 120;

    const activeTracks = midiData.tracks.filter((t) => t.notes.length > 0);

    // Calculate total duration (in seconds) to set the loop length
    const totalDuration = Math.max(
      ...activeTracks.map((t) =>
        Math.max(...t.notes.map((n) => n.time + n.duration))
      )
    );

    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = totalDuration;

    let trackIndex = 0;

    for (const track of activeTracks) {
      const idx = trackIndex++;
      const isPercussion = true; // Force all tracks as drums

      if (isPercussion) {
        // Drum track → sample-based DrumKit (shared)
        if (!drumKitRef.current) {
          const kit = createDrumKit();
          drumKitRef.current = kit;
          synthsRef.current.push(kit);
          await kit.loaded;

          // Apply current effects state
          const e = kit.effects;
          const currentFx = fxRef.current;
          e.reverb.wet.value = currentFx.reverbWet;
          // Reverb decay triggers async IR generation — apply after ready
          e.reverb.ready.then(() => {
            try { e.reverb.decay = currentFx.reverbDecay; } catch { /* ignore */ }
          });
        }

        const kit = drumKitRef.current;

        const notes = track.notes.map((note) => ({
          time: note.time,
          midi: note.midi,
          velocity: note.velocity,
        }));

        const part = new Tone.Part((time, value) => {
          if (mutedRef.current.has(idx)) return;
          kit.trigger(value.midi, time, value.velocity);
        }, notes);
        part.loop = true;
        part.loopEnd = totalDuration;
        part.start(0);
        partsRef.current.push(part);
      } else {
        // Melodic track → use GM-mapped synth
        const synth = createMelodicSynth(track.instrument.number);
        synthsRef.current.push(synth);

        const notes = track.notes.map((note) => {
          // Apply transposition: transpose the MIDI number
          const transposedMidi = note.midi + transpositionRef.current;
          // Convert back to note name
          const transposedNote = Tone.Frequency(transposedMidi, "midi").toNote();
          return {
            time: note.time,
            note: transposedNote,
            duration: note.duration,
            velocity: note.velocity,
          };
        });

        const isMono = "triggerAttackRelease" in synth && !("voices" in synth);

        const part = new Tone.Part((time, value) => {
          if (mutedRef.current.has(idx)) return;
          if (isMono) {
            (synth as Tone.MonoSynth).triggerAttackRelease(
              value.note,
              value.duration,
              time,
              value.velocity
            );
          } else {
            (synth as Tone.PolySynth).triggerAttackRelease(
              value.note,
              value.duration,
              time,
              value.velocity
            );
          }
        }, notes);
        part.loop = true;
        part.loopEnd = totalDuration;
        part.start(0);
        partsRef.current.push(part);
      }
    }

    transport.start();
    setIsPlaying(true);
    
    // Focus the button so Enter/Space can stop playback
    playButtonRef.current?.focus();
  }, [midiData, bpm, isAudioStarted, startAudio]);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
  }, []);

  // Spacebar to toggle play/stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      
      if (e.code === "Space" && midiData) {
        e.preventDefault();
        if (isPlaying) {
          stop();
        } else {
          play();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [midiData, isPlaying, play, stop]);

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MIDI Player</h1>

      {/* Preset dropdown + File upload */}
      <div className="flex flex-col items-center gap-4">
        {midiPresets.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <label htmlFor="midi-preset" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preset Loops
            </label>
            <select
              id="midi-preset"
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white"
              aria-label="Select a preset MIDI loop"
            >
              <option value="">— Select a preset —</option>
              {[...midiPresets].sort((a, b) => {
                const bpmA = Number(a.match(/(\d+)\s*BPM/i)?.[1] ?? 999);
                const bpmB = Number(b.match(/(\d+)\s*BPM/i)?.[1] ?? 999);
                return bpmA - bpmB || a.localeCompare(b);
              }).map((name) => (
                <option key={name} value={name}>
                  {name.replace(/\.midi?$/i, "").replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="h-px w-8 bg-gray-300 dark:bg-gray-700" />
          or
          <span className="h-px w-8 bg-gray-300 dark:bg-gray-700" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="midi-upload"
            className="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Load MIDI File
          </label>
          <input
            id="midi-upload"
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Upload MIDI file"
          />
        </div>

        {fileName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loaded: <span className="font-medium">{fileName}</span>
          </p>
        )}
      </div>

      {/* Track list with mute toggles */}
      {tracks.length > 0 && (
        <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Tracks ({tracks.length})
            </h2>
          </div>
          <ul aria-label="MIDI tracks" className="divide-y divide-gray-100 dark:divide-gray-700">
            {tracks.map((track, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {track.instrument}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {track.name} · {track.noteCount} notes · Ch {track.channel + 1}
                  </span>
                </div>
                <button
                  onClick={() => toggleMute(i)}
                  aria-label={`${track.muted ? "Unmute" : "Mute"} ${track.name}`}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    track.muted
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  }`}
                >
                  {track.muted ? "Muted" : "On"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drum Effects */}
      {tracks.some((t) => t.percussion) && (
        <details className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            🎛️ Drum Effects
          </summary>
          <div className="grid gap-4 px-4 pb-4">
            {/* Reverb */}
            <fieldset className="grid gap-2 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <legend className="px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Reverb</legend>
              <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                Mix
                <span className="tabular-nums w-10 text-right">{Math.round(fx.reverbWet * 100)}%</span>
              </label>
              <input type="range" min={0} max={1} step={0.01} value={fx.reverbWet}
                onChange={(e) => updateFx("reverbWet", Number(e.target.value))}
                className="w-full accent-blue-500" aria-label="Reverb mix" />
              <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                Decay
                <span className="tabular-nums w-10 text-right">{fx.reverbDecay.toFixed(1)}s</span>
              </label>
              <input type="range" min={0.1} max={10} step={0.1} value={fx.reverbDecay}
                onChange={(e) => updateFx("reverbDecay", Number(e.target.value))}
                className="w-full accent-blue-500" aria-label="Reverb decay" />
            </fieldset>
          </div>
        </details>
      )}

      {/* BPM / Tempo stretching */}
      <BpmControl
        bpm={bpm}
        min={20}
        max={300}
        onBpmChange={handleBpmChange}
        onTapTempo={tapTempo}
      />

      {/* Controls */}
      <div className="flex gap-4">
        <button
          ref={playButtonRef}
          onClick={isPlaying ? stop : play}
          disabled={!midiData}
          aria-label={isPlaying ? "Stop MIDI" : "Play MIDI"}
          className={`rounded-full px-8 py-4 text-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>
    </div>
  );
}
