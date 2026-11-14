import { resolve } from "node:path"
import { defineConfig, type UserConfig } from "vite"

const DEMO_CONFIG: UserConfig = {
  base: "./",
  input: {
    main: resolve(import.meta.dirname, "index.html"),
  },
  build: {
    outDir: "dist/app",
    emptyOutDir: false,
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "*",
    },
    proxy: {
      "/archive": {
        target: "https://archive.org/",
        rewrite: (path) => path.replace(/^\/archive/, ""),
        changeOrigin: true,
        followRedirects: true,
      },
    },
  },
}

export default defineConfig(DEMO_CONFIG)
