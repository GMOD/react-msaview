import React, { useRef, useState, useEffect } from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Ruler from './Ruler'
import TreeRuler from './TreeRuler'
import Header from './Header'

const resizeHandleWidth = 5

const Track = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { rowHeight, treeAreaWidth } = model
    return (
      <div key={track.id} style={{ display: 'flex', height: rowHeight }}>
        <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
          <TrackLabel model={model} name={track.name} />
        </div>
        <div style={{ width: resizeHandleWidth }} />
        <track.ReactComponent model={model} {...track} />
      </div>
    )
  },
)

const TrackLabel = observer(
  ({ name, model }: { model: MsaViewModel; name: string }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const { rowHeight, treeAreaWidth } = model
    const width = treeAreaWidth

    useEffect(() => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.resetTransform()
      ctx.clearRect(0, 0, treeAreaWidth, rowHeight)
      ctx.textAlign = 'right'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)
      ctx.fillStyle = 'black'
      ctx.fillText(name, width - 20, rowHeight - rowHeight / 4)
    }, [name, width, treeAreaWidth, rowHeight])
    return (
      <canvas
        ref={ref}
        width={width}
        height={rowHeight}
        style={{
          width,
          height: rowHeight,
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    )
  },
)

const VerticalResizeHandle = observer(({ model }: { model: MsaViewModel }) => {
  const [cropMouseDown, setCropMouseDown] = useState(false)

  // this has the effect of just "cropping" the tree area
  useEffect(() => {
    if (cropMouseDown) {
      const listener = (event: MouseEvent) => {
        model.setTreeAreaWidth(model.treeAreaWidth + event.movementX)
      }

      const listener2 = () => setCropMouseDown(false)

      document.addEventListener('mousemove', listener)
      document.addEventListener('mouseup', listener2)
      return () => {
        document.removeEventListener('mousemove', listener)
        document.removeEventListener('mouseup', listener2)
      }
    }
    return () => {}
  }, [cropMouseDown, model])

  return (
    <div>
      <div
        onMouseDown={() => setCropMouseDown(true)}
        style={{
          cursor: 'ew-resize',
          height: '100%',
          width: resizeHandleWidth,
          background: `rgba(200,200,200)`,
          position: 'relative',
        }}
      />
    </div>
  )
})

const HorizontalResizeHandle = observer(
  ({ model }: { model: MsaViewModel }) => {
    const [cropMouseDown, setCropMouseDown] = useState(false)

    // this has the effect of just "cropping" the tree area
    useEffect(() => {
      if (cropMouseDown) {
        const listener = (event: MouseEvent) => {
          model.setHeight(model.height + event.movementY)
        }

        const listener2 = () => setCropMouseDown(false)

        document.addEventListener('mousemove', listener)
        document.addEventListener('mouseup', listener2)
        return () => {
          document.removeEventListener('mousemove', listener)
          document.removeEventListener('mouseup', listener2)
        }
      }
      return () => {}
    }, [cropMouseDown, model])

    return (
      <div>
        <div
          onMouseDown={() => setCropMouseDown(true)}
          style={{
            cursor: 'ns-resize',
            width: '100%',
            height: resizeHandleWidth,
            background: `rgba(200,200,200)`,
            position: 'relative',
          }}
        />
      </div>
    )
  },
)

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
              <div style={{ display: 'flex', height: 20 }}>
                <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
                  <TreeRuler model={model} />
                </div>

                <div style={{ width: resizeHandleWidth }}></div>
                <Ruler model={model} />
              </div>

              {tracks?.map((track) => {
                return <Track key={track.id} model={model} track={track} />
              })}

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
    </div>
  )
})
