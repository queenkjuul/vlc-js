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

### `iframe` Mode

Due to VLC.js being multithreaded and targeting an older version of Emscripten, there is no clean way to tear down a VLC instance once one has been initialized, and it is not expected that multiple instances can coexist. Thus, one can use a premade `iframe` to encapsulate a single VLC instance, which is useful in single-page applications, where you can just create and destroy iframes as needed.

```html
<iframe id="vlc" />
```

```tsx
// using vite asset import
import vlcFrame from "@discodeck/vlc-js/vlc.html?url"
// if using TypeScript
import type VLC from "@discodeck/vlc-js"

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

Provides a static class which provides a singleton instance of a VLC.js media player.

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

See [the demo source](./src/demo.ts) for an example of how to do this.
