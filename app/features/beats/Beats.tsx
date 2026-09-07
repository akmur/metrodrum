import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { useAudio } from "@/providers/AudioProvider";
import { beats } from "virtual:beats-manifest";
import { decodeAudio, nearestFile, stretchBuffer, trimBuffer } from "./audio-utils";

export default function Beats() {
  const { isAudioStarted, startAudio } = useAudio();

  const [beatSlug, setBeatSlug] = useState(beats[0]?.slug ?? "");
  const [selectedBpm, setSelectedBpm] = useState(beats[0]?.files[0]?.bpm ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loopVersion, setLoopVersion] = useState(0);

  const loopBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playingRef = useRef(false);

  const beat = beats.find(b => b.slug === beatSlug) ?? beats[0];

  const stopSource = useCallback(() => {
    const src = sourceRef.current;
    if (src) {
      try { src.onended = null; src.stop(); src.disconnect(); } catch { /* ignore */ }
      sourceRef.current = null;
    }
  }, []);

  const startSource = useCallback(() => {
    stopSource();
    const buffer = loopBufferRef.current;
    if (!buffer) return;
    const ctx = Tone.getContext().rawContext;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(ctx.destination);
    source.start();
    sourceRef.current = source;
  }, [stopSource]);

  // Prepare (decode → trim → stretch) the loop for the current beat + tempo.
  useEffect(() => {
    if (!beat || !selectedBpm) return;
    const b = beat;
    const bpm = selectedBpm;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      (async () => {
        try {
          const file = nearestFile(b.files, bpm);
          const ratio = bpm / file.bpm;
          const decoded = await decodeAudio(file.url);
          const exactSec = (b.bars * 4 * 60) / file.bpm;
          const trimmed = trimBuffer(decoded, exactSec);
          const stretched = await stretchBuffer(trimmed, ratio);
          const targetSec = (b.bars * 4 * 60) / bpm;
          const loop = trimBuffer(stretched, targetSec);
          if (cancelled) return;
          loopBufferRef.current = loop;
          setLoading(false);
          setLoopVersion(v => v + 1);
        } catch (e) {
          if (cancelled) return;
          setLoading(false);
          setError(e instanceof Error ? e.message : String(e));
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [beat, selectedBpm]);

  // Restart playback whenever a newly prepared loop is ready while playing.
  useEffect(() => {
    if (playingRef.current && loopBufferRef.current) {
      startSource();
    }
  }, [loopVersion, startSource]);

  useEffect(() => () => stopSource(), [stopSource]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      stopSource();
      setIsPlaying(false);
      playingRef.current = false;
      return;
    }
    if (!isAudioStarted) await startAudio();
    if (!loopBufferRef.current) return;
    startSource();
    setIsPlaying(true);
    playingRef.current = true;
  }, [isPlaying, isAudioStarted, startAudio, startSource, stopSource]);

  const handleBeatChange = (slug: string) => {
    setBeatSlug(slug);
    const b = beats.find(x => x.slug === slug);
    if (b && b.files.length > 0) {
      setSelectedBpm(b.files[0].bpm);
    }
  };

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 flex flex-col gap-7">

        {beats.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
            No beats found in /samples/beats.
          </p>
        ) : (
          <>
            {/* Beat selector */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Beat
              </legend>
              <select
                value={beat?.slug ?? ""}
                onChange={e => handleBeatChange(e.target.value)}
                aria-label="Select a beat"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 capitalize"
              >
                {beats.map(b => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </fieldset>

            {/* Tempo selector */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Tempo
              </legend>
              <select
                value={selectedBpm}
                onChange={e => setSelectedBpm(Number(e.target.value))}
                aria-label="Select a tempo"
                disabled={!beat || beat.files.length === 0}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              >
                {beat?.files.map(f => (
                  <option key={f.bpm} value={f.bpm}>{f.bpm} BPM</option>
                ))}
              </select>
            </fieldset>

            {error && (
              <p className="text-center text-xs text-red-500 dark:text-red-400">{error}</p>
            )}

            <div className="w-full border-t border-gray-100 dark:border-gray-700" />

            {/* Play / Stop */}
            <button
              onClick={togglePlay}
              disabled={loading || !loopBufferRef.current || beats.length === 0}
              aria-label={isPlaying ? "Stop beat" : "Play beat"}
              className={`w-full rounded-2xl py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                  : "bg-green-500 hover:bg-green-600 shadow-green-500/30"
              }`}
            >
              {loading ? "Loading…" : isPlaying ? "Stop" : "Play"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
