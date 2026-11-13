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
  private _mediaPlayerPointer: number | null = null
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

    const buffer = this.VlcModule()._malloc(argsSize)
    let written = 0
    runtimeArguments.forEach((arg) => {
      this.VlcModule().stringToAscii(arg, buffer + written)
      written += arg.length + 1
    })

    const vlcArgs = this.VlcModule()._malloc(
      runtimeArguments.length * 4 + 4,
    )
    const viewVlcArgs = new Uint32Array(
      this.VlcModule().wasmMemory.buffer,
      vlcArgs,
      runtimeArguments.length,
    )

    written = 0
    runtimeArguments.forEach((arg, i) => {
      viewVlcArgs[i] = buffer + written
      written += arg.length + 1
    })

    this.VlcModule()._wasm_libvlc_init(
      runtimeArguments.length,
      vlcArgs,
    )
    this._mediaPlayerPointer =
      this.VlcModule()._wasm_media_player_new()

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
    this.VlcModule().canvas = canvasElem

    const canvasPointer = this.VlcModule().stringToNewUTF8(
      this._canvasId,
    )
    this.VlcModule()._wasm_media_player_set_canvas_id(
      this.mediaPlayerPointer(),
      canvasPointer,
    )
    this.VlcModule()._free(canvasPointer)

    this.VlcModule()._attach_update_events(this.mediaPlayerPointer())

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
    if (!this._mediaPlayerPointer) {
      console.warn(
        "VlcMediaPlayer.release was called on an inactive instance",
      )
      return
    }
    this.stop()
    const media = this.getMedia()
    if (media) {
      media.release()
      this.VlcModule()._wasm_media_player_set_media(
        this.mediaPlayerPointer(),
        0,
      )
    }
    const pointer = this.mediaPlayerPointer()
    this._mediaPlayerPointer = null
    this.VlcModule()._wasm_media_player_release(pointer)

    this._canvasElem?.removeEventListener("keydown", this.handleNav)
    this._canvasElem = null
  }

  public openFile = (file: File, demux?: string) => {
    this.VlcModule().vlc_access_file = {
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
    const media = new VlcMediaItem(this.VlcModule(), path)
    this.VlcModule()._wasm_media_player_set_media(
      this.mediaPlayerPointer(),
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
    const mediaPointer =
      this.VlcModule()._wasm_media_player_get_media(
        this.mediaPlayerPointer(),
      )
    this.VlcModule()._wasm_media_retain(mediaPointer)
    return new VlcMediaItem(this.VlcModule(), null, mediaPointer)
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
      this.VlcModule()._wasm_media_player_is_playing(
        this.mediaPlayerPointer(),
      ) != 0
    )
  }

  public play: () => number = () => {
    return this.VlcModule()._wasm_media_player_play(
      this.mediaPlayerPointer(),
    )
  }

  public pause: () => void = () => {
    this.VlcModule()._wasm_media_player_pause(
      this.mediaPlayerPointer(),
    )
  }

  public stop: () => void = () => {
    this.VlcModule()._wasm_media_player_stop(
      this.mediaPlayerPointer(),
    )
  }

  public getLength: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_length(
      this.mediaPlayerPointer(),
    )
  }

  public getTime: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_time(
      this.mediaPlayerPointer(),
    )
  }

  public setTime: (time: number, fast?: boolean) => number = (
    time,
    fast = false,
  ) => {
    return this.VlcModule()._wasm_media_player_set_time(
      this.mediaPlayerPointer(),
      time,
      fast ? 1 : 0,
      0,
    )
  }

  public getPosition: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_position(
      this.mediaPlayerPointer(),
    )
  }

  public setPosition: (position: number, fast?: boolean) => number = (
    position,
    fast = false,
  ) => {
    return this.VlcModule()._wasm_media_player_set_position(
      this.mediaPlayerPointer(),
      position,
      fast ? 1 : 0,
    )
  }

  public setChapter: (chapter: number) => void = (chapter) => {
    this.VlcModule()._wasm_media_player_set_chapter(
      this.mediaPlayerPointer(),
      chapter,
    )
  }

  public getChapter: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_chapter(
      this.mediaPlayerPointer(),
    )
  }

  public getChapterCount: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_chapter_count(
      this.mediaPlayerPointer(),
    )
  }

  public getChapterCountForTitle: (title: number) => number = (
    title,
  ) => {
    return this.VlcModule()._wasm_media_player_get_chapter_count_for_title(
      this.mediaPlayerPointer(),
      title,
    )
  }

  public setTitle: (title: number) => void = (title) => {
    this.VlcModule()._wasm_media_player_set_title(
      this.mediaPlayerPointer(),
      title,
    )
  }

  public getTitle: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_title(
      this.mediaPlayerPointer(),
    )
  }

  public getTitleCount: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_title_count(
      this.mediaPlayerPointer(),
    )
  }

  public previousChapter: () => void = () => {
    return this.VlcModule()._wasm_media_player_previous_chapter(
      this.mediaPlayerPointer(),
    )
  }

  public nextChapter: () => void = () => {
    return this.VlcModule()._wasm_media_player_next_chapter(
      this.mediaPlayerPointer(),
    )
  }

  public getRate: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_rate(
      this.mediaPlayerPointer(),
    )
  }

  public setRate: (rate: number) => number = (rate) => {
    return this.VlcModule()._wasm_media_player_set_rate(
      this.mediaPlayerPointer(),
      rate,
    )
  }

  public hasVout: () => number = () => {
    return this.VlcModule()._wasm_media_player_has_vout(
      this.mediaPlayerPointer(),
    )
  }

  public isSeekable: () => boolean = () => {
    return (
      this.VlcModule()._wasm_media_player_is_seekable(
        this.mediaPlayerPointer(),
      ) != 0
    )
  }

  public canPause: () => boolean = () => {
    return (
      this.VlcModule()._wasm_media_player_can_pause(
        this.mediaPlayerPointer(),
      ) != 0
    )
  }

  public programScrambled: () => boolean = () => {
    return (
      this.VlcModule()._wasm_media_player_program_scrambled(
        this.mediaPlayerPointer(),
      ) != 0
    )
  }

  public nextFrame: () => void = () => {
    this.VlcModule()._wasm_media_player_next_frame(
      this.mediaPlayerPointer(),
    )
  }

  public getSize: () => { x: number; y: number } = () => {
    let x = this.VlcModule()._wasm_video_get_size_x(
      this.mediaPlayerPointer(),
      0,
    )
    let y = this.VlcModule()._wasm_video_get_size_y(
      this.mediaPlayerPointer(),
      0,
    )

    if (x == -1 || y == -1) {
      // TODO - give more context
      throw new Error("Cannot get video size")
    }

    return { x, y }
  }

  public getCursor: () => { x: number; y: number } = () => {
    let x = this.VlcModule()._wasm_video_get_cursor_x(
      this.mediaPlayerPointer(),
      0,
    )
    let y = this.VlcModule()._wasm_video_get_cursor_y(
      this.mediaPlayerPointer(),
      0,
    )

    if (x == -1 || y == -1) {
      // TODO - give more context
      throw new Error("Cannot get video cursor")
    }

    return { x, y }
  }

  public toggleMute: () => void = () => {
    this.VlcModule()._wasm_audio_toggle_mute(
      this.mediaPlayerPointer(),
    )
  }

  public getMute: () => boolean = () => {
    return (
      this.VlcModule()._wasm_audio_get_mute(
        this.mediaPlayerPointer(),
      ) != 0
    )
  }

  public setMute: (mute: boolean) => void = (mute) => {
    this.VlcModule()._wasm_audio_set_mute(
      this.mediaPlayerPointer(),
      mute ? 1 : 0,
    )
  }

  public getVolume: () => number = () => {
    return this.VlcModule()._wasm_audio_get_volume(
      this.mediaPlayerPointer(),
    )
  }

  public setVolume: (volume: number) => number = (volume) => {
    return this.VlcModule()._wasm_audio_set_volume(
      this.mediaPlayerPointer(),
      volume,
    )
  }

  public getDelay: () => number = () => {
    return this.VlcModule()._wasm_audio_get_delay(
      this.mediaPlayerPointer(),
    )
  }

  public setDelay: (delay: number) => number = (delay) => {
    return this.VlcModule()._wasm_audio_set_delay(
      this.mediaPlayerPointer(),
      delay,
    )
  }

  public getRole: () => number = () => {
    return this.VlcModule()._wasm_media_player_get_role(
      this.mediaPlayerPointer(),
    )
  }

  public setRole: (role: number) => number = (role) => {
    return this.VlcModule()._wasm_media_player_set_role(
      this.mediaPlayerPointer(),
      role,
    )
  }

  public navigate: (nav: VlcNavigationCommand) => void = (nav) => {
    this.VlcModule()._wasm_media_player_navigate(
      this.mediaPlayerPointer(),
      nav,
    )
  }

  private mediaPlayerPointer() {
    if (!this._mediaPlayerPointer) {
      throw new Error("VLC instance not yet initialized")
    }
    return this._mediaPlayerPointer
  }

  private VlcModule(): VlcWasmModule {
    if (!this._VlcModule) {
      throw new Error("VLC instance not yet initialized")
    }
    return this._VlcModule
  }

  public isInitialized() {
    return !!this._mediaPlayerPointer
  }
}
