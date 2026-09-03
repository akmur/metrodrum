import { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

export interface DetectedNote {
  midi: number;
  clarity: number;
}

const CLARITY_THRESHOLD = 0.9;
const MIN_VOLUME_DB = -40;

export function usePitchDetector(enabled: boolean) {
  const [note, setNote] = useState<DetectedNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastMidiRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setNote(null);
      setError(null);
      lastMidiRef.current = null;
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;

    const publish = (value: DetectedNote | null) => {
      const midi = value ? value.midi : null;
      if (midi !== lastMidiRef.current) {
        lastMidiRef.current = midi;
        setNote(value);
      }
    };

    const loop = (
      analyser: AnalyserNode,
      detector: PitchDetector<Float32Array>,
      buf: Float32Array<ArrayBuffer>,
      sampleRate: number,
    ) => {
      if (cancelled) return;
      analyser.getFloatTimeDomainData(buf);
      const [pitch, clarity] = detector.findPitch(buf, sampleRate);
      if (pitch > 0 && clarity >= CLARITY_THRESHOLD) {
        publish({ midi: Math.round(12 * Math.log2(pitch / 440) + 69), clarity });
      } else {
        publish(null);
      }
      raf = requestAnimationFrame(() => loop(analyser, detector, buf, sampleRate));
    };

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone not supported in this browser.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        ctx = new AudioContext();
        await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const detector = PitchDetector.forFloat32Array(analyser.fftSize);
        detector.clarityThreshold = CLARITY_THRESHOLD;
        detector.minVolumeDecibels = MIN_VOLUME_DB;

        const buf = new Float32Array(analyser.fftSize);
        loop(analyser, detector, buf, ctx.sampleRate);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (ctx) ctx.close().catch(() => {});
      lastMidiRef.current = null;
      setNote(null);
      setError(null);
    };
  }, [enabled]);

  return { note, error };
}
