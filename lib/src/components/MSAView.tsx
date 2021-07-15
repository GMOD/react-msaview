import React from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Ruler from './Ruler'
import TreeRuler from './TreeRuler'
import Header from './Header'
import Track from './Track'

import { HorizontalResizeHandle, VerticalResizeHandle } from './ResizeHandles'

const RulerArea = observer(({ model }: { model: MsaViewModel }) => {
  const { resizeHandleWidth, treeAreaWidth } = model
  return (
    <div style={{ display: 'flex', height: 20 }}>
      <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
        <TreeRuler model={model} />
      </div>

      <div style={{ width: resizeHandleWidth }}></div>
      <Ruler model={model} />
    </div>
  )
})
export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized, treeAreaWidth, height, tracks } = model

  return (
    <div>
      {!initialized ? (
        <ImportForm model={model} />
      ) : !done ? (
        <Typography variant="h4">Loading...</Typography>
      ) : (
        <div>
          <div style={{ height, overflow: 'hidden' }}>
            <Header model={model} />
            <div>
              <RulerArea model={model} />

              {tracks?.map(track => (
                <Track key={track.id} model={model} track={track} />
              ))}

              <div style={{ display: 'flex' }}>
                <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
                  <TreeCanvas model={model} />
                </div>
                <VerticalResizeHandle model={model} />
                <MSACanvas model={model} />
              </div>
            </div>
          </div>
          <HorizontalResizeHandle model={model} />
        </div>
      )}

      {model.DialogComponent ? (
        <model.DialogComponent
          {...(model.DialogProps || {})}
          onClose={() => {
            model.setDialogComponent(undefined, undefined)
          }}
        />
      ) : null}
    </div>
  )
})
