import VLC from "./lib/VLC.ts"
/*
  Load the WASM bundle and initialize VLC
*/
await VLC.load({
  /* 
    fetch[/demux]://http[s]://example.com/path/to/file
  */
  filePath:
    "fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso",

  /* 
    if that link doesn't work, try this:
  */
  // filePath: `fetch/dvd://http://${window.location.host}/archive/download/BigBuckBunny/big-buck-bunny-NTSC.iso`,
  runtimeArguments: "-vvv", // any VLC command-line arguments
  /* canvasId: "my-canvas" */ // optional, default "vlc-output"
})

const vlc = VLC.player // optional, for convenience

/*
  if you did not specify a file path in load(), set one now:
*/
// vlc.setMedia(path)

/*
  Or, you can open a local file from the browser file picker:
*/
const input = document.querySelector<HTMLInputElement>("#file-input")
const demux = document.querySelector<HTMLInputElement>("#demux-input")

input?.addEventListener("change", (_e) => {
  const file = input.files?.item(0)
  if (file) {
    vlc.stop()
    vlc.openFile(file, demux?.value)
    vlc.play()
  }
})

vlc.play()

// The rest of this file is just the demo controls
const [playButton, pauseButton, stopButton, prevButton, nextButton] =
  ["#play", "#pause", "#stop", "#prev", "#next"].map((id) => {
    return document.querySelector(id)
  })

playButton?.addEventListener("click", (_e) => {
  vlc.play()
})
pauseButton?.addEventListener("click", (_e) => {
  vlc.pause()
})
stopButton?.addEventListener("click", (_e) => {
  vlc.stop()
})
prevButton?.addEventListener("click", (_e) => {
  vlc.previousChapter()
})
nextButton?.addEventListener("click", (_e) => {
  vlc.nextChapter()
})
