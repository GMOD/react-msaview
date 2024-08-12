import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import { isAlive, onSnapshot } from 'mobx-state-tree'
import { MSAView } from 'react-msaview'
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'
import useMeasure from '@jbrowse/core/util/useMeasure'

// locals
import AppGlobal, { AppModel } from './model'

const urlParams = new URLSearchParams(window.location.search)
const val = urlParams.get('data')

const mymodel = AppGlobal.create(
  val ? JSON.parse(val) : { msaview: { type: 'MsaView' } },
)

let lastTime = 0
onSnapshot(mymodel, snap => {
  const now = Date.now()
  if (now - lastTime >= 1000) {
    lastTime = now
    const url = new URL(window.document.URL)
    url.searchParams.set('data', JSON.stringify(snap))
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
