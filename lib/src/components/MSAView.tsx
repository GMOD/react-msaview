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

            <Rubberband
              model={model}
              ControlComponent={<Ruler model={model} />}
            />
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
