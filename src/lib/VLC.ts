import type { VlcMediaPlayerOptions, VlcWasmModule } from "./module"
import { importScript, toBlobURL } from "./util"
import VlcMediaPlayer from "./VlcMediaPlayer"

export const VLC_READY_VALUE = "vlc-ready"

export default class VLC {
  static vlcAudio = new URL(
    "/audio-worklet-processor.js",
    window.origin,
  ).href
  static vlcJs = new URL("/vlc.js", window.origin).href
  static vlcWorker = new URL("/vlc.worker.js", window.origin).href
  static vlcWasm = new URL("/vlc.wasm", window.origin).href

  static #loaded = false
  static #loading = false

  static #player: VlcMediaPlayer
  static #module: VlcWasmModule

  constructor() {
    // this doesn't seem to always take? so we verify in load()
    window.VLC = VLC
  }

  public static load = async (
    opts?: VlcMediaPlayerOptions,
    onProgress?: (loaded: number, total: number) => void,
  ) => {
    if (VLC.#loaded) return
    VLC.#loading = true
    try {
      const [js, wasm, worker, audio] = await Promise.all([
        toBlobURL(VLC.vlcJs, "text/javascript"),
        onProgress
          ? fetchWithXHRProgress(VLC.vlcWasm, onProgress)
          : fetch(VLC.vlcWasm).then((r) => r.arrayBuffer()),
        toBlobURL(VLC.vlcWorker, "text/javascript"),
        toBlobURL(VLC.vlcAudio, "text/javascript"),
      ])
      await importScript(VLC.vlcJs)
      const defaultModule = {
        print: function (text: string) {
          console.log(text)
        },
        printErr: function (text: string) {
          console.error(text)
        },
        mainScriptUrlOrBlob: js,
        wasmBinary: wasm,
        audioWorkletUrl: audio,
        locateFile: (path: string) => {
          return path.endsWith("vlc.worker.js") ? worker : path
        },
      }
      if (!window.initVLC) {
        throw new Error(
          "initVLC was never attached to the window, cannot proceed",
        )
      }
      VLC.#module = await window.initVLC({
        ...defaultModule,
        ...opts?.module,
      })
      VLC.#player = new VlcMediaPlayer({
        ...opts,
        module: VLC.module,
      })

      if (!window.VLC) {
        // it's possible the constructor failed to attach (why though? idk)
        // window.VLC must exist for VLC.js to fire events to the main thread
        window.VLC = VLC
      }
    } catch (e) {
      console.error("failed to load VLC.js", e)
      VLC.#loading = false
      throw e
    }
    VLC.#loading = false
    VLC.#loaded = true
  }

  static get player() {
    return VLC.#player
  }
  static get module() {
    return VLC.#module
  }

  static get loading(): boolean {
    return VLC.#loading
  }
  static get loaded(): boolean {
    return VLC.#loaded
  }
}

function fetchWithXHRProgress(
  url: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", url)
    xhr.responseType = "arraybuffer"

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total)
      }
    }

    xhr.onload = () => resolve(xhr.response)
    xhr.onerror = () => reject(new Error("Download failed"))

    xhr.send()
  })
}
