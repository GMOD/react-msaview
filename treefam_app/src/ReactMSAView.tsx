import { isAlive, onSnapshot } from 'mobx-state-tree'
import useMeasure from '@jbrowse/core/util/useMeasure'
import { useEffect } from 'react'
import AppModel from './model'
import { MSAView } from 'react-msaview'
import { observer } from 'mobx-react'

// locals
// import AppGlobal from './model'
// let lastTime = 0
// onSnapshot(mymodel, snap => {
//   const now = Date.now()
//   if (now - lastTime >= 1000) {
//     lastTime = now
//     const url = new URL(window.document.URL)
//     url.searchParams.set('data', JSON.stringify(snap))
//     window.history.replaceState(null, '', url.toString())
//   }
// })

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

const mymodel = AppModel.create({
  msaview: {
    type: 'MsaView',
  },
})
mymodel.msaview.setHeight(800)

const ReactMSAView = observer(function ({
  msa,
  tree,
}: {
  msa: string
  tree: string
}) {
  const ref = useWidthSetter(mymodel.msaview)
  useEffect(() => {
    mymodel.msaview.setData({ msa, tree })
  }, [msa, tree])
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <MSAView model={mymodel.msaview} />
    </div>
  )
})

export default ReactMSAView
