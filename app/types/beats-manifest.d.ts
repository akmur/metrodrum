declare module "virtual:beats-manifest" {
  export interface BeatFile {
    bpm: number;
    url: string;
  }
  export interface Beat {
    slug: string;
    name: string;
    bars: number;
    files: BeatFile[];
  }
  export const beats: Beat[];
}
