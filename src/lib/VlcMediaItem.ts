import type { VlcWasmModule } from "./module";

export class VlcMediaItem {
  public mediaPointer: number;

  private VlcModule: VlcWasmModule;

  constructor(module: VlcWasmModule, path: string | null, rawPointer?: number) {
    this.VlcModule = module;
    if (rawPointer) {
      this.mediaPointer = rawPointer;
      return;
    }

    if (path === null) {
      throw new Error("Creating a VlcMediaItem requires either a path or a pointer");
    }

    const pathPointer = this.VlcModule.stringToNewUTF8(path);
    this.mediaPointer = this.VlcModule._wasm_media_new_location(pathPointer);
    this.VlcModule._free(pathPointer);

    if (this.mediaPointer == 0) {
      throw new Error(`Failed to create VlcMediaItem from path ${path}`);
    }
  }

  public release = () => {
    if (this.mediaPointer == 0) {
      throw new Error("VlcMediaItem already released");
    }
    this.VlcModule._wasm_media_release(this.mediaPointer);
    this.mediaPointer = 0;
  };
}
