import { useEffect, useState } from 'react'

import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import useMeasure from '@jbrowse/core/util/useMeasure'
import { isAlive } from '@jbrowse/mobx-state-tree'
import { Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { MSAView } from 'react-msaview'

import StructureSection from './StructureSection'
import TopBar from './TopBar'
import { createApp, linkParam } from './model'

import type { AppModel } from './model'

const mymodel = await createApp(linkParam(window.location))

// A link pasted over this one that differs only in its fragment changes the
// URL without loading the page. The app's own replaceState fires no event.
window.addEventListener('hashchange', () => {
  window.location.reload()
})

// Published for the screenshot harness the way jbrowse-web publishes
// window.JBrowseSession: a callout that wants to point at alignment column 38
// resolves it here (colWidth/scrollX/rowHeight/scrollY) at capture time, rather
// than hardcoding a pixel that silently goes stale when the viewport width,
// colWidth or scroll position changes. See scripts/screenshots/annotations.mjs.
declare global {
  interface Window {
    MSAVIEW_MODEL?: typeof mymodel.msaview
  }
}
window.MSAVIEW_MODEL = mymodel.msaview

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
  // the structure area stays closed until asked for, since most alignments
  // have none, and a link that already carries a structure opens it
  const [structureOpen, setStructureOpen] = useState(
    () => msaview.mappedStructures.length > 0,
  )
  // beside the alignment once a row maps onto a structure, under it before then
  const split = structureOpen && msaview.mappedStructures.length > 0
  return (
    <div>
      <TopBar
        model={model}
        structureOpen={structureOpen}
        onToggleStructure={() => {
          setStructureOpen(open => !open)
        }}
      />
      <Box
        sx={{
          display: 'grid',
          alignItems: 'start',
          gridTemplateColumns: split
            ? 'minmax(0, 1fr) minmax(380px, 42%)'
            : 'minmax(0, 1fr)',
        }}
      >
        <Box
          ref={ref}
          data-testid="msaview"
          sx={{ border: 1, borderColor: 'divider', m: 2.5 }}
        >
          <MSAView model={msaview} />
        </Box>
        {structureOpen ? (
          <StructureSection
            model={msaview}
            panelHeight={split ? 520 : 400}
            sx={split ? { position: 'sticky', top: 8, ml: 0 } : undefined}
          />
        ) : null}
      </Box>
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
