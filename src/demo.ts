import VLC from "./lib/VLC.ts"

/*
    Remote file path format: 
    fetch[/demux]://http[s]://example.com/path/to/file
*/
const defaultFilePath =
  "fetch/dvd://https://archive.queenkjuul.com/big-buck-bunny-NTSC.iso"
// backup: `fetch/dvd://http://${window.location.host}/archive/download/BigBuckBunny/big-buck-bunny-NTSC.iso`

const filePath = localStorage.getItem("filePath") || defaultFilePath

/*
  Load the WASM bundle and initialize VLC

  You can optionally preconfigure asset paths for your environment:
    VLC.vlcWasm = new URL("/assets/wasm/vlc.wasm", window.origin).href
    await VLC.load()
*/
await VLC.load({
  filePath, // optional, can use VLC.player.setMedia(filePath) later
  runtimeArguments: "-vvv", // any VLC command-line arguments
  /* canvasId: "my-canvas", */ // optional, default "vlc-output"
  /* module: { // optional, override Emscripten module defaults
    preRun: [() => { console.log("getting ready") }],
    onRuntimeInitialized: () => console.log("runtime ready"),
    print: (text) => myLogger(text),
    ...
   } */
})

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
    VLC.player.stop()
    VLC.player.openFile(file, demux?.value)
    VLC.player.play()
  }
})

/*
  You can use VLC's events to build your UI
  See libvlc_events.h or libvlc_events.ts for the whole list
*/
VLC.player.addEventListener("MediaPlayerOpening", () => {
  const status = document.querySelector("#status")
  if (!status) return
  status.textContent = "Loading Content"
})
VLC.player.addEventListener("MediaPlayerPlaying", () => {
  const status = document.querySelector("#status")
  if (!status) return
  status.textContent = "Playing Content"
})

VLC.player.setTitle(0) // opens the DVD menu first
VLC.player.play()

// The rest of this file is just the demo controls
const [
  playButton,
  pauseButton,
  stopButton,
  prevButton,
  nextButton,
  menuButton,
] = ["#play", "#pause", "#stop", "#prev", "#next", "#menu"].map(
  (id) => {
    return document.querySelector(id)
  },
)

const vlc = VLC.player
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
menuButton?.addEventListener("click", (_e) => {
  vlc.setTitle(0)
})

const filePathInput =
  document.querySelector<HTMLInputElement>("#file-path")
if (filePathInput) {
  filePathInput.value = filePath
}
const openButton = document.querySelector<HTMLButtonElement>("#open")
openButton?.addEventListener("click", (_e) => {
  if (!filePathInput) return
  if (filePathInput.value === filePath) return
  let path = filePathInput.value
  if (path.startsWith("https://") || path.startsWith("http://")) {
    if (demux?.value) {
      path = `fetch/${demux}://${path}`
    } else {
      path = `fetch://${path}`
    }
  } else if (
    !path.startsWith("fetch:") &&
    !path.startsWith("fetch/")
  ) {
    alert("MRL must start with fetch://, http://, or https://")
    return
  }
  localStorage.setItem("filePath", path)
  location.reload()
})
