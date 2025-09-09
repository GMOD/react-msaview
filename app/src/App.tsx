import React, { useEffect } from 'react'

import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import useMeasure from '@jbrowse/core/util/useMeasure'
import { ThemeProvider } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { isAlive, onSnapshot } from 'mobx-state-tree'
import pako from 'pako'
import { MSAView } from 'react-msaview'

// locals
import AppGlobal, { AppModel } from './model'

// Utility functions for URL-safe base64 gzip encoding/decoding
function encodeData(data: unknown): string {
  const jsonString = JSON.stringify(data)
  return jsonString
  // const compressed = pako.gzip(jsonString)
  // const base64 = btoa(String.fromCharCode(...compressed))
  // // Convert to URL-safe base64: replace + with -, / with _, and remove padding =
  // return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decodeData(encodedData: string): unknown {
  // If string starts with '{', treat as plain JSON
  if (encodedData.startsWith('{')) {
    try {
      return JSON.parse(encodedData)
    } catch (error) {
      console.warn('Failed to parse JSON data:', error)
      return null
    }
  }

  // Otherwise, treat as base64 gzip encoded data
  try {
    // Convert URL-safe base64 back to regular base64
    let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }

    const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const decompressed = pako.ungzip(compressed, { to: 'string' })
    return JSON.parse(decompressed)
  } catch (error) {
    // Final fallback to regular JSON parsing
    try {
      return JSON.parse(encodedData)
    } catch {
      console.warn('Failed to decode URL data:', error)
      return null
    }
  }
}

const urlParams = new URLSearchParams(window.location.search)
const val = urlParams.get('data')

const mymodel = AppGlobal.create(
  val
    ? decodeData(val) || {
        msaview: {
          type: 'MsaView',
        },
      }
    : {
        msaview: {
          type: 'MsaView',
        },
      },
)

let lastTime = 0
onSnapshot(mymodel, snap => {
  const now = Date.now()
  if (now - lastTime >= 1000) {
    lastTime = now
    const url = new URL(window.document.URL)
    url.searchParams.set('data', encodeData(snap))
    window.history.replaceState(null, '', url.toString())
  }
})

// used in ViewContainer files to get the width
function useWidthSetter(view: { setWidth: (arg: number) => void }) {
  const [ref, { width }] = useMeasure()
  useEffect(() => {
    if (width && isAlive(view)) {
      // sets after a requestAnimationFrame
      // https://stackoverflow.com/a/58701523/2129219 avoids ResizeObserver
      // loop error being shown during development
      requestAnimationFrame(() => {
        view.setWidth(width)
      })
    }
  }, [view, width])
  return ref
}

const App = observer(function ({ model }: { model: AppModel }) {
  const { msaview } = model
  const ref = useWidthSetter(msaview)
  return (
    <div>
      <div ref={ref} style={{ border: '1px solid black', margin: 20 }}>
        <MSAView model={msaview} />
      </div>
      <div style={{ height: 500 }} />
    </div>
  )
})

const MainApp = () => {
  const theme = createJBrowseTheme()
  return (
    <ThemeProvider theme={theme}>
      <App model={mymodel} />
    </ThemeProvider>
  )
}

export default MainApp
