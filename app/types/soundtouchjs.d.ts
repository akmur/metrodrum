declare module "soundtouchjs" {
  export class PitchShifter {
    constructor(
      context: BaseAudioContext,
      buffer: AudioBuffer,
      bufferSize?: number,
      onEnd?: () => void,
    );
    tempo: number;
    pitch: number;
    pitchSemitones: number;
    rate: number;
    connect(node: AudioNode): void;
    disconnect(): void;
    on(eventName: string, cb: (detail?: unknown) => void): void;
    off(eventName?: string): void;
  }
}
