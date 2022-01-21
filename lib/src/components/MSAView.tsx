import React, { useRef, useEffect } from 'react'

import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import Rubberband from './Rubberband'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Ruler from './Ruler'
import TreeRuler from './TreeRuler'
import Header from './Header'
import Track from './Track'
import AnnotationDialog from './AnnotationDlg'
import GeneScoreCanvas from './GeneScoreCanvas'

import { HorizontalResizeHandle, VerticalResizeHandle } from './ResizeHandles'
import { MsaViewModel } from '../model'

const MouseoverCanvas = observer(({ model }: { model: MsaViewModel }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const {
    height,
    width,
    treeAreaWidth,
    resizeHandleWidth,
    scrollX,
    mouseCol,
    colWidth,
  } = model

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const ctx = ref.current.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.resetTransform()
    ctx.clearRect(0, 0, width, height)

    if (mouseCol !== undefined) {
      const x =
        (mouseCol - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth
      ctx.fillStyle = 'rgba(100,100,100,0.5)'
      ctx.fillRect(x, 0, colWidth, height)
    }
  }, [
    mouseCol,
    colWidth,
    scrollX,
    height,
    resizeHandleWidth,
    treeAreaWidth,
    width,
  ])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    />
  )
})
export default observer(({ model }: { model: MsaViewModel }) => {
  const {
    done,
    initialized,
    treeAreaWidth,
    height,
    resizeHandleWidth,
    turnedOnTracks,
  } = model

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
                  <div style={{ flexShrink: 0, width: treeAreaWidth }}>
                    <TreeCanvas model={model} />
                  </div>
                  <VerticalResizeHandle model={model} />
                  <MSACanvas model={model} />
                  <MouseoverCanvas model={model} />
                  <div style={{ flexShrink: 0, width: treeAreaWidth }}>
                    <GeneScoreCanvas model={model} />
                  </div>
                </div>
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

      {model.annotPos ? (
        <AnnotationDialog
          data={model.annotPos}
          model={model}
          onClose={() => model.clearAnnotPos()}
        />
      ) : null}
    </div>
  )
})
