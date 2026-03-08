import * as Tone from "tone";

/**
 * Sample-based GM Drum Kit.
 * Maps MIDI note numbers to WAV files in /samples/drums/.
 * Falls back to synthesized sounds for unmapped notes.
 */

const SAMPLE_MAP: Record<number, string> = {
  // Kicks
  35: "/samples/drums/kick.wav",
  36: "/samples/drums/kick.wav",
  // Snare — no snare sample available, use rimshot as closest match
  38: "/samples/drums/snare.wav",
  40: "/samples/drums/snare.wav",
  // Hi-hats
  42: "/samples/drums/hihat-closed.wav",
  44: "/samples/drums/hihat-closed.wav",
  46: "/samples/drums/hihat-open.wav",
  // Toms
  41: "/samples/drums/tom-low.wav",
  43: "/samples/drums/tom-low.wav",
  45: "/samples/drums/tom-mid.wav",
  47: "/samples/drums/tom-mid.wav",
  48: "/samples/drums/tom-high.wav",
  50: "/samples/drums/tom-high.wav",
  // Cymbals
  49: "/samples/drums/splash.wav",
  51: "/samples/drums/ride.wav",
  52: "/samples/drums/splash.wav",
  55: "/samples/drums/splash.wav",
  57: "/samples/drums/ride.wav",
  // Rimshot / Cowbell / Clap
  37: "/samples/drums/rimshot.wav",
  39: "/samples/drums/clap.wav",
  56: "/samples/drums/cowbell.wav",
};

export interface DisposableNode {
  dispose(): void;
}

export interface DrumEffects {
  reverb: Tone.Reverb;
}

export interface DrumKit {
  trigger(midi: number, time: number, velocity: number): void;
  dispose(): void;
  readonly loaded: Promise<void>;
  readonly effects: DrumEffects;
}

export function createDrumKit(): DrumKit {
  const allNodes: DisposableNode[] = [];

  // Reverb only
  const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.15 });
  allNodes.push(reverb);
  reverb.toDestination();

  const effects: DrumEffects = { reverb };

  // Build note-name → url mapping for Tone.Sampler (polyphonic)
  const urls: Record<string, string> = {};
  for (const [midiStr, url] of Object.entries(SAMPLE_MAP)) {
    const noteName = Tone.Frequency(Number(midiStr), "midi").toNote();
    urls[noteName] = url;
  }

  const sampler = new Tone.Sampler({ urls, release: 0.3 });
  sampler.connect(Tone.getDestination());
  sampler.connect(reverb);
  allNodes.push(sampler);

  const loaded = Tone.loaded();

  return {
    loaded,
    effects,
    trigger(midi: number, time: number, velocity: number) {
      try {
        const noteName = Tone.Frequency(midi, "midi").toNote();
        sampler.triggerAttackRelease(noteName, 1, time, velocity);
      } catch {
        // Ignore timing edge-cases during rapid playback
      }
    },
    dispose() {
      allNodes.forEach((n) => n.dispose());
    },
  };
}

/**
 * GM program ranges → synth factory.
 * Maps General MIDI instrument families to distinct Tone.js synth types.
 */

type MelodicSynth = Tone.PolySynth | Tone.MonoSynth;

export function createMelodicSynth(programNumber: number): MelodicSynth {
  // Piano (0-7)
  if (programNumber <= 7) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle8" },
      envelope: { attack: 0.005, decay: 0.6, sustain: 0.2, release: 0.8 },
    }).toDestination();
  }

  // Chromatic Percussion (8-15) — vibes, marimba, xylophone
  if (programNumber <= 15) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.05, release: 0.4 },
    }).toDestination();
  }

  // Organ (16-23)
  if (programNumber <= 23) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square8" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.8, release: 0.3 },
    }).toDestination();
  }

  // Guitar (24-31)
  if (programNumber <= 31) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fmtriangle" },
      envelope: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.5 },
    }).toDestination();
  }

  // Bass (32-39)
  if (programNumber <= 39) {
    return new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { type: "lowpass", frequency: 600, Q: 2 },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.2 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.3,
        release: 0.2,
        baseFrequency: 100,
        octaves: 2.5,
      },
    }).toDestination();
  }

  // Strings (40-47)
  if (programNumber <= 47) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth8" },
      envelope: { attack: 0.15, decay: 0.3, sustain: 0.7, release: 0.5 },
    }).toDestination();
  }

  // Ensemble / Strings ensemble (48-55)
  if (programNumber <= 55) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", spread: 20, count: 3 },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.7, release: 0.6 },
    }).toDestination();
  }

  // Brass (56-63)
  if (programNumber <= 63) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square4" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.3 },
    }).toDestination();
  }

  // Reed (64-71)
  if (programNumber <= 71) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fmsquare" },
      envelope: { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.3 },
    }).toDestination();
  }

  // Pipe / Flute (72-79)
  if (programNumber <= 79) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine4" },
      envelope: { attack: 0.08, decay: 0.2, sustain: 0.6, release: 0.4 },
    }).toDestination();
  }

  // Synth Lead (80-87)
  if (programNumber <= 87) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    }).toDestination();
  }

  // Synth Pad (88-95)
  if (programNumber <= 95) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", spread: 30, count: 3 },
      envelope: { attack: 0.4, decay: 0.5, sustain: 0.8, release: 1.0 },
    }).toDestination();
  }

  // Default — generic synth
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.4 },
  }).toDestination();
}

/** Label for UI display */
export function getInstrumentLabel(
  programNumber: number,
  percussion: boolean,
): string {
  if (percussion) return "🥁 Drums";
  if (programNumber <= 7) return "🎹 Piano";
  if (programNumber <= 15) return "🔔 Chromatic Perc";
  if (programNumber <= 23) return "🎛️ Organ";
  if (programNumber <= 31) return "🎸 Guitar";
  if (programNumber <= 39) return "🎸 Bass";
  if (programNumber <= 47) return "🎻 Strings";
  if (programNumber <= 55) return "🎻 Ensemble";
  if (programNumber <= 63) return "🎺 Brass";
  if (programNumber <= 71) return "🎷 Reed";
  if (programNumber <= 79) return "🪈 Pipe";
  if (programNumber <= 87) return "🎹 Synth Lead";
  if (programNumber <= 95) return "🎹 Synth Pad";
  return "🎵 Other";
}
