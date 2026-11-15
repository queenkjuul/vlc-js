export type * from "./lib/module"
export type { VlcMediaPlayerOptions } from "./lib/module"
export * from "./lib/nav"
export { default, VLC_READY_VALUE } from "./lib/VLC"
export * from "./lib/VlcMediaItem"
export { default as VlcMediaPlayer } from "./lib/VlcMediaPlayer"
export type { MainModule } from "./vlc/libvlc"

export function createVLCIframeSrc(
  width = 1280,
  height = 720,
): string {
  const entryUrl = new URL("./iframe.global.js", import.meta.url).href

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark" />
    <style>
      html,
      body {
        padding: 0px;
        margin: 0px;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <canvas id="vlc-output" width="${width}" height="${height}"></canvas>
    <script src="${entryUrl}"></script>
  </body>
</html>`

  return URL.createObjectURL(new Blob([html], { type: "text/html" }))
}
