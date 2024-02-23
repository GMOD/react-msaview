import React, { Suspense } from 'react'
import { observer } from 'mobx-react'

// locals
import TreeRuler from './TreePanel/TreeRuler'
import Header from './Header'
import Track from './Track'
import { HorizontalResizeHandle, VerticalResizeHandle } from './ResizeHandles'
import { MsaViewModel } from '../model'
import MSAPanel from './MSAPanel'
import TreePanel from './TreePanel'
import Minimap from './Minimap'

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
    </div>
  )
}

const View = observer(function ({ model }: { model: MsaViewModel }) {
  const { turnedOnTracks } = model
  return (
    <div style={{ paddingLeft: 20, position: 'relative' }}>
      <TopArea model={model} />
      {turnedOnTracks?.map(track => (
        <Track key={track.model.id} model={model} track={track} />
      ))}
      <MainArea model={model} />
    </div>
  )
})

const MSAView = observer(function ({ model }: { model: MsaViewModel }) {
  const { height, DialogComponent, DialogProps } = model
  return (
    <div>
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
    </div>
  )
})

export default MSAView
