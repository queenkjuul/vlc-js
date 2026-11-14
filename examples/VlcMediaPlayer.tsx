// @ts-nocheck
/*
  This file is not necessarily copy-pastable. 
  It assumes you are using Vite.
  You probably need to adjust the asset paths.
*/

/*
@discodeck/vlc-react
Copyright (C) 2026 queenkjuul

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import VLC, {
  createVLCIframeSrc,
  VLC_READY_VALUE,
  type VlcMediaPlayerOptions,
} from "@discodeck/vlc-js"
import vlcAudio from "@discodeck/vlc-js/audio-worklet-processor.js?url"
import vlcJs from "@discodeck/vlc-js/vlc.js?url"
import vlcWasm from "@discodeck/vlc-js/vlc.wasm?url"
import vlcWorker from "@discodeck/vlc-js/vlc.worker.js?url"
import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react"
import styleToCss from "style-object-to-css-string"

export type VlcMediaPlayerProps = {
  vlcRef: RefObject<typeof VLC | null>
  source?: string | File
  demux?: string
  options?: VlcMediaPlayerOptions
  className?: string
  style?: CSSProperties
  stylesheetUrl?: string
  onLoad?: () => void
  loadingView?: ReactNode
  children?: ReactNode
}

export default function VlcMediaPlayer({
  vlcRef,
  source,
  demux,
  options,
  className: _className,
  style,
  stylesheetUrl,
  onLoad,
  loadingView,
  children,
}: VlcMediaPlayerProps): ReactElement {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)

  const [loaded, setLoaded] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const setIframeRef = useCallback((el: HTMLIFrameElement | null) => {
    setIframe(el)
  }, [])

  useEffect(() => {
    if (loaded || !iframe) return
    const listener = async (message: MessageEvent) => {
      if (!iframe) return
      if (message.data === VLC_READY_VALUE) {
        const vlc = iframe.contentWindow?.VLC
        if (!vlc) {
          throw new Error(
            "VLC reported ready but was not attached to the iframe window",
          )
        }
        vlc.vlcJs = (import.meta.env.DEV ? window.origin : "") + vlcJs
        vlc.vlcAudio =
          (import.meta.env.DEV ? window.origin : "") + vlcAudio
        vlc.vlcWorker =
          (import.meta.env.DEV ? window.origin : "") + vlcWorker
        vlc.vlcWasm =
          (import.meta.env.DEV ? window.origin : "") + vlcWasm
        await vlc.load(options)
        setLoaded(() => true)
        setLoading(() => false)
        vlcRef.current = vlc
        if (typeof source === "string") {
          vlc.player.setMedia(source)
        } else if (source) {
          vlc.player.openFile(source, demux)
        }
        onLoad?.()

        if (iframe) {
          const doc = iframe.contentDocument
          if (!doc) return
          if (stylesheetUrl) {
            iframe.contentWindow.postMessage({
              action: "vlc-stylesheet",
              payload: stylesheetUrl,
            })
          }
          if (style) {
            doc.body.style = styleToCss(style)
          }
          doc.documentElement.style.colorScheme =
            document.documentElement.style.colorScheme
        }
      }
    }

    if (iframe) {
      iframe.contentWindow?.addEventListener("message", listener)
    }

    return () => {
      iframe?.contentWindow?.removeEventListener("message", listener)
    }
  }, [
    vlcRef,
    iframe,
    options,
    loaded,
    onLoad,
    demux,
    stylesheetUrl,
    source,
    style,
  ])

  return (
    <>
      {loading && loadingView}
      {children}
      <VlcFrame ref={setIframeRef} />
    </>
  )
}

export const VlcFrame = forwardRef<HTMLIFrameElement>(
  function VlcFrame(_, ref) {
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
      const url = createVLCIframeSrc()
      setSrc(url)
      return () => URL.revokeObjectURL(url)
    }, [])

    return src ? (
      <iframe
        ref={ref}
        src={src}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    ) : null
  },
)
