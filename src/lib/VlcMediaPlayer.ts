import type { VlcMediaPlayerOptions, VlcWasmModule } from "./module"
import {
  VlcNavigationCommands,
  type VlcNavigationCommand,
} from "./nav"
import { VlcMediaItem } from "./VlcMediaItem"

type VlcMediaPlayerConstructorOptions = Omit<
  VlcMediaPlayerOptions,
  "module"
> & {
  module: VlcWasmModule
}

/**
 * Class which encapsulates a VLC.js Emscripten module, handles its
 * lifecycle, and wraps common module-level functions
 *
 * @class VlcMediaPlayer
 *
 * @typedef {VlcMediaPlayer} *
 * @export
 */
export default class VlcMediaPlayer {
  private _VlcModule: VlcWasmModule | null = null
  private _pointer: number | null = null
  private _canvasId: string
  private _canvasElem: HTMLCanvasElement | null = null

  constructor({
    canvasId = "vlc-output",
    filePath,
    module,
    runtimeArguments = [],
  }: VlcMediaPlayerConstructorOptions) {
    this._VlcModule = module
    this._canvasId = canvasId

    // RUNTIME ARGUMENTS========================
    if (typeof runtimeArguments === "string") {
      runtimeArguments = runtimeArguments.split(" ")
    }

    const argsSize = runtimeArguments.reduce(
      (acc, curr) => (acc += curr.length + 1),
      0,
    )

    const buffer = this.VlcModule._malloc(argsSize)
    let written = 0
    runtimeArguments.forEach((arg) => {
      this.VlcModule.stringToAscii(arg, buffer + written)
      written += arg.length + 1
    })

    const vlcArgs = this.VlcModule._malloc(
      runtimeArguments.length * 4 + 4,
    )
    const viewVlcArgs = new Uint32Array(
      this.VlcModule.wasmMemory.buffer,
      vlcArgs,
      runtimeArguments.length,
    )

    written = 0
    runtimeArguments.forEach((arg, i) => {
      viewVlcArgs[i] = buffer + written
      written += arg.length + 1
    })

    this.VlcModule._wasm_libvlc_init(runtimeArguments.length, vlcArgs)
    this._pointer = this.VlcModule._wasm_media_player_new()

    // CANVAS===========================================
    const canvasElem = document.querySelector<HTMLCanvasElement>(
      `#${this._canvasId}`,
    )
    if (!canvasElem) {
      throw new Error(
        `VlcMediaPlayer requires a valid canvas element to render. Looked for one with id=${this._canvasId} and did not find one.`,
      )
    }
    this._canvasElem = canvasElem
    this.VlcModule.canvas = canvasElem

    const canvasPointer = this.VlcModule.stringToNewUTF8(
      this._canvasId,
    )
    this.VlcModule._wasm_media_player_set_canvas_id(
      this.pointer,
      canvasPointer,
    )
    this.VlcModule._free(canvasPointer)

    this.VlcModule._attach_update_events(this.pointer)

    canvasElem.addEventListener("keydown", this.handleNav)

    if (filePath) {
      this.setMedia(filePath)
    }
  }

  private handleNav = (e: KeyboardEvent) => {
    let navigate: VlcNavigationCommand
    switch (e.code) {
      case "Enter":
        navigate = VlcNavigationCommands.Activate
        break
      case "ArrowUp":
        navigate = VlcNavigationCommands.Up
        break
      case "ArrowDown":
        navigate = VlcNavigationCommands.Down
        break
      case "ArrowLeft":
        navigate = VlcNavigationCommands.Left
        break
      case "ArrowRight":
        navigate = VlcNavigationCommands.Right
        break
      default:
        return
    }
    this.navigate(navigate)
  }

  /** Free memory associated with a VlcMediaPlayer instance */
  public release = () => {
    if (!this._pointer) {
      console.warn(
        "VlcMediaPlayer.release was called on an inactive instance",
      )
      return
    }
    this.stop()
    const media = this.getMedia()
    if (media) {
      media.release()
      this.VlcModule._wasm_media_player_set_media(this.pointer, 0)
    }
    const pointer = this.pointer
    this._pointer = null
    this.VlcModule._wasm_media_player_release(pointer)

    this._canvasElem?.removeEventListener("keydown", this.handleNav)
    this._canvasElem = null
  }

  public openFile = (file: File, demux?: string) => {
    this.VlcModule.vlc_access_file = {
      1: file,
    }
    this.setMedia(`emjsfile${demux ? `/${demux}` : ""}://1`)
  }

  /**
   * Set the media item to a VlcMediaItem at the provided path
   *
   * @param {string} path
   */
  public setMedia = (path: string) => {
    const media = new VlcMediaItem(this.VlcModule, path)
    this.VlcModule._wasm_media_player_set_media(
      this.pointer,
      media.mediaPointer,
    )
    media.release()
  }

  /**
   * Retrieve a VlcMediaItem for the currently active media item
   *
   * @returns {VlcMediaItem}
   */
  public getMedia: () => VlcMediaItem = () => {
    const mediaPointer = this.VlcModule._wasm_media_player_get_media(
      this.pointer,
    )
    this.VlcModule._wasm_media_retain(mediaPointer)
    return new VlcMediaItem(this.VlcModule, null, mediaPointer)
  }

  public togglePlay: () => void = () => {
    if (!this.isPlaying()) {
      this.play()
    } else {
      this.pause()
    }
  }

  public isPlaying: () => boolean = () => {
    return (
      this.VlcModule._wasm_media_player_is_playing(this.pointer) != 0
    )
  }

  public play: () => number = () => {
    return this.VlcModule._wasm_media_player_play(this.pointer)
  }

  public pause: () => void = () => {
    this.VlcModule._wasm_media_player_pause(this.pointer)
  }

  public stop: () => void = () => {
    this.VlcModule._wasm_media_player_stop(this.pointer)
  }

  public getLength: () => number = () => {
    return this.VlcModule._wasm_media_player_get_length(this.pointer)
  }

  public getTime: () => number = () => {
    return this.VlcModule._wasm_media_player_get_time(this.pointer)
  }

  public setTime: (time: number, fast?: boolean) => number = (
    time,
    fast = false,
  ) => {
    return this.VlcModule._wasm_media_player_set_time(
      this.pointer,
      time,
      fast ? 1 : 0,
      0,
    )
  }

  public getPosition: () => number = () => {
    return this.VlcModule._wasm_media_player_get_position(
      this.pointer,
    )
  }

  public setPosition: (position: number, fast?: boolean) => number = (
    position,
    fast = false,
  ) => {
    return this.VlcModule._wasm_media_player_set_position(
      this.pointer,
      position,
      fast ? 1 : 0,
    )
  }

  public setChapter: (chapter: number) => void = (chapter) => {
    this.VlcModule._wasm_media_player_set_chapter(
      this.pointer,
      chapter,
    )
  }

  public getChapter: () => number = () => {
    return this.VlcModule._wasm_media_player_get_chapter(this.pointer)
  }

  public getChapterCount: () => number = () => {
    return this.VlcModule._wasm_media_player_get_chapter_count(
      this.pointer,
    )
  }

  public getChapterCountForTitle: (title: number) => number = (
    title,
  ) => {
    return this.VlcModule._wasm_media_player_get_chapter_count_for_title(
      this.pointer,
      title,
    )
  }

  public setTitle: (title: number) => void = (title) => {
    this.VlcModule._wasm_media_player_set_title(this.pointer, title)
  }

  public getTitle: () => number = () => {
    return this.VlcModule._wasm_media_player_get_title(this.pointer)
  }

  public getTitleCount: () => number = () => {
    return this.VlcModule._wasm_media_player_get_title_count(
      this.pointer,
    )
  }

  public previousChapter: () => void = () => {
    return this.VlcModule._wasm_media_player_previous_chapter(
      this.pointer,
    )
  }

  public nextChapter: () => void = () => {
    return this.VlcModule._wasm_media_player_next_chapter(
      this.pointer,
    )
  }

  public getRate: () => number = () => {
    return this.VlcModule._wasm_media_player_get_rate(this.pointer)
  }

  public setRate: (rate: number) => number = (rate) => {
    return this.VlcModule._wasm_media_player_set_rate(
      this.pointer,
      rate,
    )
  }

  public hasVout: () => number = () => {
    return this.VlcModule._wasm_media_player_has_vout(this.pointer)
  }

  public isSeekable: () => boolean = () => {
    return (
      this.VlcModule._wasm_media_player_is_seekable(this.pointer) != 0
    )
  }

  public canPause: () => boolean = () => {
    return (
      this.VlcModule._wasm_media_player_can_pause(this.pointer) != 0
    )
  }

  public programScrambled: () => boolean = () => {
    return (
      this.VlcModule._wasm_media_player_program_scrambled(
        this.pointer,
      ) != 0
    )
  }

  public nextFrame: () => void = () => {
    this.VlcModule._wasm_media_player_next_frame(this.pointer)
  }

  public getSize: () => { x: number; y: number } = () => {
    let x = this.VlcModule._wasm_video_get_size_x(this.pointer, 0)
    let y = this.VlcModule._wasm_video_get_size_y(this.pointer, 0)

    if (x == -1 || y == -1) {
      // TODO - give more context
      throw new Error("Cannot get video size")
    }

    return { x, y }
  }

  public getCursor: () => { x: number; y: number } = () => {
    let x = this.VlcModule._wasm_video_get_cursor_x(this.pointer, 0)
    let y = this.VlcModule._wasm_video_get_cursor_y(this.pointer, 0)

    if (x == -1 || y == -1) {
      // TODO - give more context
      throw new Error("Cannot get video cursor")
    }

    return { x, y }
  }

  public toggleMute: () => void = () => {
    this.VlcModule._wasm_audio_toggle_mute(this.pointer)
  }

  public getMute: () => boolean = () => {
    return this.VlcModule._wasm_audio_get_mute(this.pointer) != 0
  }

  public setMute: (mute: boolean) => void = (mute) => {
    this.VlcModule._wasm_audio_set_mute(this.pointer, mute ? 1 : 0)
  }

  public getVolume: () => number = () => {
    return this.VlcModule._wasm_audio_get_volume(this.pointer)
  }

  public setVolume: (volume: number) => number = (volume) => {
    return this.VlcModule._wasm_audio_set_volume(this.pointer, volume)
  }

  public getDelay: () => number = () => {
    return this.VlcModule._wasm_audio_get_delay(this.pointer)
  }

  public setDelay: (delay: number) => number = (delay) => {
    return this.VlcModule._wasm_audio_set_delay(this.pointer, delay)
  }

  public getRole: () => number = () => {
    return this.VlcModule._wasm_media_player_get_role(this.pointer)
  }

  public setRole: (role: number) => number = (role) => {
    return this.VlcModule._wasm_media_player_set_role(
      this.pointer,
      role,
    )
  }

  public navigate: (nav: VlcNavigationCommand) => void = (nav) => {
    this.VlcModule._wasm_media_player_navigate(this.pointer, nav)
  }

  private get VlcModule(): VlcWasmModule {
    if (!this._VlcModule) {
      throw new Error("VLC instance not yet initialized")
    }
    return this._VlcModule
  }

  public get pointer() {
    if (!this._pointer) {
      throw new Error("VLC instance not yet initialized")
    }
    return this._pointer
  }

  public get isInitialized() {
    return !!this._pointer
  }
}
