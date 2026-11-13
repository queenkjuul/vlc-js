// @ts-nocheck
/* === COPY FROM BELOW THIS LINE: ===*/

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
  VLC_READY_VALUE,
  type VlcMediaPlayerOptions,
} from "@discodeck/vlc-js"
import iframeUrl from "@discodeck/vlc-js/vlc.html?url"
import {
  useEffect,
  useRef,
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
  className,
  style,
  stylesheetUrl,
  onLoad,
  loadingView,
  children,
}: VlcMediaPlayerProps): ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [loaded, setLoaded] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (loaded) return
    const iframe = iframeRef.current
    const listener = async (message: MessageEvent) => {
      if (!iframe) return
      if (message.data === VLC_READY_VALUE) {
        const vlc = iframe.contentWindow?.VLC
        if (!vlc) {
          throw new Error(
            "VLC reported ready but was not attached to the iframe window",
          )
        }
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
          iframe.contentWindow?.addEventListener("message", listener)
        }
      }
    }

    return () => {
      iframe?.contentWindow?.removeEventListener("message", listener)
    }
  }, [
    vlcRef,
    iframeRef,
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
      <iframe ref={iframeRef} {...{ className }} src={iframeUrl} />
    </>
  )
}
