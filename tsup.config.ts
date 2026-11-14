import { defineConfig } from "tsup"

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: {
      resolve: true,
    },
    sourcemap: true,
    clean: true,
    publicDir: "src/vlc",
    target: "es2020",
  },
  {
    entry: { iframe: "src/iframe.ts" },
    format: "iife",
    noExternal: [/.*/],
    sourcemap: true,
    clean: false,
    target: "es2020",
  },
])
