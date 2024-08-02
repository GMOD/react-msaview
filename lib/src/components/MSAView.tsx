import React, { Suspense } from 'react'
import { observer } from 'mobx-react'

// locals
import { HorizontalResizeHandle, VerticalResizeHandle } from './ResizeHandles'
import { MsaViewModel } from '../model'
import TreeRuler from './tree/TreeRuler'
import Header from './header/Header'
import MSAPanel from './msa/MSAPanel'
import TreePanel from './tree/TreePanel'
import Minimap from './minimap/Minimap'
import VerticalScrollbar from './VerticalScrollbar'

function TopArea({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ display: 'flex' }}>
      <TreeRuler model={model} />
      <Minimap model={model} />
    </div>
  )
}
function MainArea({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ display: 'flex' }}>
      <TreePanel model={model} />
      <VerticalResizeHandle model={model} />
      <MSAPanel model={model} />
      <VerticalScrollbar model={model} />
    </div>
  )
}

const View = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ position: 'relative' }}>
      <TopArea model={model} />

      <MainArea model={model} />
    </div>
  )
})

const MSAView = observer(function ({ model }: { model: MsaViewModel }) {
  const { height, viewInitialized, DialogComponent, DialogProps } = model
  return (
    <div>
      {viewInitialized ? (
        <>
          <div style={{ height, overflow: 'hidden' }}>
            <Header model={model} />
            <View model={model} />
          </div>
          <HorizontalResizeHandle model={model} />

          {DialogComponent ? (
            <Suspense fallback={null}>
              <DialogComponent {...DialogProps} />
            </Suspense>
          ) : null}
        </>
      ) : null}
    </div>
  )
})

export default MSAView
