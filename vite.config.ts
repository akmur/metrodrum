import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "node:fs";
import path from "node:path";

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
  plugins: [tailwindcss(), midiManifestPlugin(), reactRouter(), tsconfigPaths()],
});
