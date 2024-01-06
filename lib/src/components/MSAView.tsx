import React, { lazy, Suspense } from 'react'

import { observer } from 'mobx-react'
import { Typography } from '@mui/material'

// locals
import ImportForm from './ImportForm'
import Rubberband from './Rubberband'
import Ruler from './Ruler'
import TreeRuler from './TreePanel/TreeRuler'
import Header from './Header'
import Track from './Track'

import { HorizontalResizeHandle, VerticalResizeHandle } from './ResizeHandles'
import { MsaViewModel } from '../model'
import MSAPanel from './MSAPanel'
import TreePanel from './TreePanel'

const AnnotationDialog = lazy(() => import('./dialogs/AnnotationDlg'))

const MSAView = observer(function ({ model }: { model: MsaViewModel }) {
  const { done, initialized } = model

  return (
    <div>
      {!initialized ? (
        <ImportForm model={model} />
      ) : !done ? (
        <Typography variant="h4">Loading...</Typography>
      ) : (
        <MSAView2 model={model} />
      )}
    </div>
  )
})

const Minimap = observer(function ({ model }: { model: MsaViewModel }) {
  const { scrollX, msaAreaWidth: W, colWidth, numColumns } = model
  const unit = W / numColumns
  const start = -scrollX / colWidth
  const end = -scrollX / colWidth + W / colWidth
  const s = start * unit
  const e = end * unit
  const HEIGHT = 56
  const TOP = 10
  const fill = 'rgba(66, 119, 127, 0.3)'
  return (
    <svg height={HEIGHT} style={{ width: '100%' }}>
      <rect x={0} y={0} width={W} height={TOP} stroke="black" fill="none" />
      <rect x={s} y={0} width={e - s} height={TOP} fill={fill} />
      <polygon
        fill={fill}
        points={[
          [e, TOP],
          [s, TOP],
          [0, HEIGHT],
          [W, HEIGHT],
        ].toString()}
      />
    </svg>
  )
})

const MSAView2 = observer(function ({ model }: { model: MsaViewModel }) {
  const { treeAreaWidth, height, turnedOnTracks } = model
  return (
    <div>
      <div style={{ height, overflow: 'hidden' }}>
        <Header model={model} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ flexShrink: 0, width: treeAreaWidth }}>
              <TreeRuler model={model} />
            </div>
            <Minimap model={model} />
          </div>
          {turnedOnTracks?.map(track => (
            <Track key={track.model.id} model={model} track={track} />
          ))}

          <div style={{ display: 'flex' }}>
            <TreePanel model={model} />
            <VerticalResizeHandle model={model} />
            <MSAPanel model={model} />
          </div>
        </div>
      </div>
      <HorizontalResizeHandle model={model} />

      {model.DialogComponent ? (
        <Suspense fallback={null}>
          <model.DialogComponent
            {...(model.DialogProps || {})}
            onClose={() => model.setDialogComponent()}
          />
        </Suspense>
      ) : null}

      {model.annotPos ? (
        <Suspense fallback={null}>
          <AnnotationDialog
            data={model.annotPos}
            model={model}
            onClose={() => model.clearAnnotationClickBoundaries()}
          />
        </Suspense>
      ) : null}
    </div>
  )
})

export default MSAView
