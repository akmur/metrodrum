import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "node:fs";
import path from "node:path";

function beatsManifestPlugin(): Plugin {
  const BEATS_DIR = "public/samples/beats";
  const VIRTUAL_ID = "virtual:beats-manifest";
  const RESOLVED_ID = "\0" + VIRTUAL_ID;
  const RE = /^(.+)-(\d+)bars-(\d+)bpm\.(wav|mp3|m4a)$/i;

  function getBeats() {
    const dir = path.resolve(BEATS_DIR);
    if (!fs.existsSync(dir)) return [];
    const map = new Map<string, { slug: string; name: string; bars: number; files: Array<{ bpm: number; url: string }> }>();
    for (const f of fs.readdirSync(dir).sort()) {
      const m = f.match(RE);
      if (!m) continue;
      const slug = m[1];
      const bars = Number(m[2]);
      const bpm = Number(m[3]);
      if (!map.has(slug)) map.set(slug, { slug, name: slug.replace(/-/g, " "), bars, files: [] });
      map.get(slug)!.files.push({ bpm, url: `/samples/beats/${f}` });
    }
    return Array.from(map.values()).map(b => ({
      ...b,
      files: b.files.sort((a, c) => a.bpm - c.bpm),
    }));
  }

  return {
    name: "beats-manifest",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export const beats = ${JSON.stringify(getBeats())};`;
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.includes("samples/beats") && /\.(wav|mp3|m4a)$/i.test(file)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) return [mod];
      }
    },
  };
}

function midiManifestPlugin(): Plugin {
  const MIDI_DIR = "public/samples/midi";
  const VIRTUAL_ID = "virtual:midi-manifest";
  const RESOLVED_ID = "\0" + VIRTUAL_ID;

  function getMidiFiles(): string[] {
    const dir = path.resolve(MIDI_DIR);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.midi?$/i.test(f))
      .sort();
  }

  return {
    name: "midi-manifest",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        const files = getMidiFiles();
        return `export const midiPresets = ${JSON.stringify(files)};`;
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.includes("samples/midi") && /\.midi?$/i.test(file)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) return [mod];
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), beatsManifestPlugin(), midiManifestPlugin(), reactRouter(), tsconfigPaths()],
});
