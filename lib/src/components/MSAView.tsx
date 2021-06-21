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
    const { rowHeight } = model
    return (
      <div key={track.id} style={{ display: 'flex', height: rowHeight }}>
        <TrackLabel model={model} name={track.name} />
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
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 7)}px`)
      ctx.fillStyle = 'black'
      ctx.fillText(name, width, rowHeight - rowHeight / 8)
    }, [name, width, treeAreaWidth, rowHeight])
    return (
      <canvas
        ref={ref}
        width={width}
        height={rowHeight}
        style={{ width, height: rowHeight, overflow: 'hidden' }}
      />
    )
  },
)

const ResizeHandle = observer(({ model }: { model: MsaViewModel }) => {
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

export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized, treeAreaWidth, height, tracks } = model

  return !initialized ? (
    <ImportForm model={model} />
  ) : !done ? (
    <Typography variant="h4">Loading...</Typography>
  ) : (
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

        <div
          style={{
            display: 'flex',
          }}
        >
          <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
            <TreeCanvas model={model} />
          </div>
          <ResizeHandle model={model} />
          <MSACanvas model={model} />
        </div>
      </div>
    </div>
  )
})
