import { PitchShifter } from "soundtouchjs";
import type { BeatFile } from "virtual:beats-manifest";

const DECODE_SAMPLE_RATE = 44100;

export function nearestFile(files: BeatFile[], bpm: number): BeatFile {
  let best = files[0];
  for (const f of files) {
    if (Math.abs(f.bpm - bpm) < Math.abs(best.bpm - bpm)) best = f;
  }
  return best;
}

export async function decodeAudio(url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  const ctx = new OfflineAudioContext(2, 1, DECODE_SAMPLE_RATE);
  return ctx.decodeAudioData(arrayBuffer);
}

export function trimBuffer(buffer: AudioBuffer, seconds: number): AudioBuffer {
  const frames = Math.max(1, Math.floor(seconds * buffer.sampleRate));
  const out = new AudioBuffer({
    numberOfChannels: buffer.numberOfChannels,
    length: frames,
    sampleRate: buffer.sampleRate,
  });
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src.subarray(0, Math.min(frames, src.length)));
  }
  return out;
}

// Pitch-preserving time-stretch (tempo change) via SoundTouchJS.
export async function stretchBuffer(buffer: AudioBuffer, ratio: number): Promise<AudioBuffer> {
  if (Math.abs(ratio - 1) < 0.001) return buffer;
  const sampleRate = buffer.sampleRate;
  const outDuration = buffer.duration / ratio;
  const length = Math.max(1, Math.ceil((outDuration + 1) * sampleRate));
  const offline = new OfflineAudioContext(2, length, sampleRate);
  const shifter = new PitchShifter(offline, buffer, 4096);
  shifter.tempo = ratio;
  shifter.connect(offline.destination);
  return offline.startRendering();
}
