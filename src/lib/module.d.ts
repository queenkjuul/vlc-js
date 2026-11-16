import type { MainModule, WasmModule } from "../vlc/libvlc"
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

type VlcPointerFunction = (pointer: number, ...args: any[]) => any
type VlcPointerFunctionKey<T extends WasmModule> = {
  [K in keyof T]-?: T[K] extends VlcPointerFunction ? K : never
}
// Source - https://stackoverflow.com/a/58765199
// Posted by georg
// Retrieved 2026-11-14, License - CC BY-SA 4.0

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never

export type VlcModuleFunctionName = VlcPointerFunctionKey<MainModule>
export type VlcModuleFunctionArgs<K extends VlcModuleFunctionName> =
  Parameters<OmitFirstArg<MainModule[K]>>
export type VlcModuleFunctionReturn<K extends VlcModuleFunctionName> =
  ReturnType<MainModule[K]>

declare global {
  interface Window {
    initVLC?: (
      module: Partial<VlcWasmModule>,
    ) => Promise<VlcWasmModule>
    VLC?: typeof VLC
  }
}
