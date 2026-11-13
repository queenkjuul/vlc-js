# VLC.js React component `VlcMediaPlayer`

This is a React component which wraps [the `vlc-js` iframe player.](https://github.com/queenkjuul/vlc-js) Under the hood it runs [my fork](https://github.com/queenkjuul/vlc.js) of [Alaric Senat's fork](https://code.videolan.org/asenat/vlc.js) of [VLC.js by Jean-Baptiste Kempf of VideoLAN.](https://code.videolan.org/jbk/vlc.js)

It is **EXPERIMENTAL,** somewhat unstable, not very performant, and has no hardware acceleration. However, it is easy to use, and it supports video formats that can't be played with standard Web APIs. It can also navigate and render DVDs, as demonstrated with [`discodeck`](https://github.com/queenkjuul/discodeck). The player can open files from the local filesystem, or it can open files over HTTP(S), as long as those files are served with appropriate CORS headers.

## Installation

I struggled for too long to get proper npm packaging working for this component, and eventually I gave up. Just copy the component into your project. It's not that complicated of a component.

## Usage

```tsx
const vlcRef = useRef<typeof VLC>(null)
<VlcMediaPlayer
  vlcRef={vlcRef} // required, use this to control playback via vlcRef.current.player, see VlcMediaPlayer class in vlc-js
  className="h-full w-full" // applied to the iframe container
  source={`fetch/dvd://https://archive.queenkjuul.org/big-buck-bunny-NTSC.iso`} // optional, MRL string or File
  options={{ runtimeArguments: "-vvv" }} // optional; any VLC CLI options are supported (in theory)
  stylesheetUrl="https://mysite.com/vlc/styles.css" // optional, provides a stylesheet to the embedded iframe document
  style={{
    "background-color": "black", // optional, React CssProperties object. passed into the iframe and applied to the <body> element
  }}
  demux="dvd" // optional, override VLC automatic demuxer selection
  loadingView={
    <MyLoadingSpinner /> // optional, markup to display during initial loading phase
  }
  onLoad={() => { // optional, runs after VLC is loaded
    if (!vlcRef.current) return
    // vlcRef.current.player.setMedia(url) // if you didn't provide one in source or filePath
    // vlcRef.current.player.openFile(file) // if using a local file via browser file picker
    vlcRef.current.player.play()
  }}
/>
```
