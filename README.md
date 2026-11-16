# vlc-js

This is an **EXPERIMENTAL** NPM package based around [my fork](https://github.com/queekjuul/vlc.js) of [Alaric Senat's fork](https://code.videolan.org/asenat/vlc.js) of [the original VLC.js project by Jean-Baptiste Kempf of VideoLAN.](https://code.videolan.org/jbk/vlc.js) It aims for working DVD video support and a modern, easy-to-use, TypeScript API.

It was developed for use in [`discodeck`](https://github.com/queenkjuul/discodeck) and may prove useful for playing certain file formats that aren't supported by standard Web APIs. Performance and compatibility are suboptimal, so you are [as usual] better off using a standard Web API when available. HD content plays poorly and hardware acceleration is not available.

## Demo

Requires `npm`. Built with Node 26, older versions may work

```sh
git clone https://github.com/queenkjuul/vlc-js
cd vlc-js
npm ci
npm run dev
```

## How to Use

_Recommended: [examine the demo source](./src/demo.ts)_

`npm install @discodeck/vlc-js`

The first step is always to call `await VLC.load()`, with an optional options object. From there, the standard playback controls are available via `VLC.player` e.g. `VLC.player.play()`. `VLC.player` is also an `EventTarget` that handles any event from `libvlc_event_e` just like you're used to with any other JS/TS `EventTarget`:

```ts
await VLC.load({
  filePath: "fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso"
})
const openingHandeler = () => {
  status = "Opening Media"
}
VLC.player.addEventListener("MediaPlayerOpening", openingHandler)
VLC.player.play()
...
// cleanup later
VLC.player.removeEventListener("MediaPlayerOpening", openingHandler)
```

You can call any of the `VlcWasmModule` functions which take a `media_player` pointer with `VLC.player.run()`:

```ts
const stringPointer = VLC.module.stringToNewUTF8("Blend")
VLC.player.run("_libvlc_video_set_deinterlace", 1, stringPointer)
VLC.module._free(stringPointer)
```

Or, to do the same thing using `VLC.module` directly:

```ts
const stringPointer = VLC.module.stringToNewUTF8("Blend")
VLC.module._libvlc_video_set_deinterlace(
  VLC.player.pointer,
  1,
  stringPointer,
)
VLC.module._free(stringPointer)
```

### `iframe` Mode

Due to VLC.js being multithreaded and targeting an older version of Emscripten, there is no clean way to tear down a VLC instance once one has been initialized, and it is not expected that multiple instances can coexist. Thus, one can use a premade `iframe` to encapsulate a single VLC instance, which is useful in single-page applications, where you can just create and destroy iframes as needed.

The `createVLCIframeSrc()` function takes 4 optional arguments:

- `width`, `height`: size of the Canvas element (framebuffer size, not display size)
- `canvasStyle`: HTML style string to apply to the `<canvas id="vlc-output">` element within the iframe
- `bodyStyle`: HTML style string to apply to the `body` element within the iframe

```html
<iframe id="vlc" />
```

```tsx
import type VLC, { createVLCIframeSrc } from "@discodeck/vlc-js"

const vlcFrame = createVLCIframeSrc()

const vlcElem = document.querySelector("#vlc")
vlcElem.contentWindow?.addEventListener("message", async (event) => {
  if (event.data === "vlc-ready") {
    const vlc = vlcElem.contentWindow?.VLC
    if (!vlc) {
      throw new Error("VLC reported ready but it is not attached to the iframe window")
    }
    await vlc.load()
    vlc.player.setMedia("fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso")
    vlc.player.play()
  }
}
vlcElem.src = vlcFrame
```

### Library Mode

Provides a static class which provides a singleton instance of a VLC.js media player. Once it is instantiated, it cannot be fully torn down.

```html
<canvas id="vlc-output" width="1280" height="720"></canvas>
```

```ts
import VLC from "@discodeck/vlc-js"

await VLC.load({
  runtimeArguments: "-vvv", // debug logging (optional)
})
VLC.player.setMedia(
  "fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso",
)
VLC.player.play()
```

### React Component

There is a React component you can copy into your own project in [`./examples/VlcMediaPlayer.tsx`](./examples/README.md). I tried to package it for NPM but because of the iframe, I could never get the packaged asset paths to resolve correctly in a consuming app, so I gave up, but you can look at my implementation for inspiration.

### File Access

#### Remote Files

The MRL pattern is like this:

`fetch[/demux]://http[s]://example.com/path/to/file.ext`

- `fetch` tells VLC to use the Emscripten fetch API.
- `/demux` optionally tells VLC which demuxing module to use. For example, to open a DVD ISO file, one would use `fetch/dvd://`
- `http[s]` tells the browser what protocol to use to make the request (you need to use `https` for any public sites)

Put it all together and you get (for example)

`fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso`

#### Local Files

VLC.js can open a local file that is selected via the standard JavaScript File API and an `<input type="file" />` element.

See [the demo source](./src/demo.ts) for an example of how to do this using `VLC.player.openFile(file)`

## Development

For hacking on the `vlc-js` TypeScript wrapper, you can just use

`npm run dev`

and modify the `demo.ts` script (and the code in `src/lib/`)

For modifying VLC.js or the underlying VLC build themselves, you can:

1. Run `fetch.sh` to grab the VLC.js and VLC sources. By default, it will clone my forks and checkout the branches used for the published builds of `vlc-js`. You can override this with the `VLC_SOURCE`, `VLC_BRANCH`, `VLCJS_SOURCE`, and `VLCJS_BRANCH` environment variables.
2. Run `compile.sh`. This will compile VLC for wasm-emscripten using the VLC.js tooling, then copy the necessary outputs into the `vlc-js` source tree.
3. Run `npm run build` to generate the `vlc-js` TypeScript library in `dist/`
4. (optional) Run `npm link` from the `vlc-js` root, then run `npm link @discodeck/vlc-js` in your consuming project to use your local checkout in a consuming app.

### Docker (recommended)

If you plan to modify VLC source yourself, you may want to run `./fetch.sh` as your normal user before running the Docker build (which runs as root).

`docker run --rm -it -v $PWD:/build -w /build queenkjuul/discodeck-vlc:latest /build/compile.sh`

To build the image locally:

`docker build -t discodeck-vlc .`

after which compiling becomes:

`docker run --rm -it -v $PWD:/build -w /build discodeck-vlc /build/compile.sh`
