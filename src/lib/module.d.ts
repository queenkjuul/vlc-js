import type { MainModule } from "../vlc/libvlc"
import type VLC from "./VLC"

/**
 * Additional runtime methods exported from the VLC Emscripten module
 *
 * @typedef {ExportedRuntimeMethods} *
 * @export
 * @interface ExportedRuntimeMethods
 */
export interface ExportedRuntimeMethods {
  /**
   * Write a string to C UTF-8
   *
   * @param {string} text
   * @returns {number} Pointer to the C string
   */
  stringToNewUTF8(text: string): number
  /**
   * Write a string to C
   *
   * @param {string} text
   * @param {number} size Length of buffer to store string
   */
  stringToAscii(text: string, size: number): void
  /**
   * Emscripten memory access
   *
   * @type {{
   *   buffer: any
   * }}
   */
  wasmMemory: {
    buffer: any
  }

  /**
   * Dictionary of JS files to make accessible to VLC.js
   *
   * @type {Record<string, File>}
   */
  vlc_access_file: Record<number, File>

  /**
   * Blob URL for the audio worklet JS file
   *
   * @type {string}
   */
  audioWorkletUrl: string
}

/**
 * Class which encapsulates a VLC.js Emscripten instance
 *
 * @extends {EmscriptenModule} Base Emscripten methods common to all
 *   Emscripten modules
 * @extends {MainModule} VLC specific exported functions
 * @extends {ExportedRuntimeMethods} Additional Emscripten methods
 *   exposed via VLC.js build config
 *
 * @typedef {VlcWasmModule} *
 * @export
 * @interface VlcWasmModule
 */
export interface VlcWasmModule
  extends EmscriptenModule, MainModule, ExportedRuntimeMethods {
  canvas?: HTMLCanvasElement
}

/**
 * Options to pass to the VlcMediaPlayer constructor. If filePath is
 * provided, the module will be initialized with the file at that
 * path. runtimeArguments are appended to the defaults.
 *
 * @typedef {VlcMediaPlayerOptions} *
 * @export
 */
export type VlcMediaPlayerOptions = {
  canvasId?: string
  filePath?: string
  module?: Partial<MainModule>
  runtimeArguments?: string | string[]
}

declare global {
  interface Window {
    initVLC?: (
      module: Partial<VlcWasmModule>,
    ) => Promise<VlcWasmModule>
    VLC?: typeof VLC
  }
}
