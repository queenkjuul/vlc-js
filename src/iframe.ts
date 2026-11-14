import VLC, { VLC_READY_VALUE } from "./lib/VLC"
window.VLC = VLC
window.onmessage = (event) => {
  if (event.data.action === "vlc-stylesheet") {
    const link = document.createElement("link")
    link.href = event.data.payload
    link.type = "text/css"
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }
}
window.postMessage(VLC_READY_VALUE)
