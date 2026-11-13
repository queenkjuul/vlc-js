import vlcAudio from "../vlc/audio-worklet-processor.js?url"
import vlcJs from "../vlc/vlc.js?url"
import vlcWorker from "../vlc/vlc.worker.js?url"
import type { VlcMediaPlayerOptions, VlcWasmModule } from "./module"
import { importScript, toBlobURL } from "./util"
import VlcMediaPlayer from "./VlcMediaPlayer"

export const VLC_READY_VALUE = "vlc-ready"

export default class VLC {
  static WASM_URL = new URL("../vlc/vlc.wasm", import.meta.url).href

  static #loaded = false
  static #loading = false

  static #player: VlcMediaPlayer
  static #module: VlcWasmModule

  public static load = async (opts?: VlcMediaPlayerOptions) => {
    if (VLC.#loaded) return
    VLC.#loading = true
    try {
      const [js, wasm, worker, audio] = await Promise.all([
        toBlobURL(vlcJs, "text/javascript"),
        fetch(VLC.WASM_URL).then((r) => r.arrayBuffer()),
        toBlobURL(vlcWorker, "text/javascript"),
        toBlobURL(vlcAudio, "text/javascript"),
      ])
      await importScript(vlcJs)
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
