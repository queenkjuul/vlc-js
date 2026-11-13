import { resolve } from "node:path"
import { defineConfig, type UserConfig } from "vite"
import dts from "vite-plugin-dts"
import { viteStaticCopy } from "vite-plugin-static-copy"

const LIB_CONFIG: UserConfig = {
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "src/vlc/vlc.wasm",
          dest: ".",
          rename: { stripBase: 2 },
        },
      ],
    }),
    dts({
      include: ["src"],
      bundleTypes: true,
      tsconfigPath: "./tsconfig.app.json",
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
  },
}

export default defineConfig(
  process.env.LIB == "1"
    ? LIB_CONFIG
    : {
        base: "./",
        input: {
          main: resolve(import.meta.dirname, "index.html"),
          vlc: resolve(import.meta.dirname, "vlc.html"),
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
      },
)
