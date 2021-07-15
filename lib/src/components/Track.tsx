import React, { useRef, useEffect } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

export const TrackLabel = observer(
  ({ name, model }: { model: MsaViewModel; name: string }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const { rowHeight, treeAreaWidth, highResScaleFactor } = model
    const width = treeAreaWidth

    useEffect(() => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
      ctx.clearRect(0, 0, treeAreaWidth, rowHeight)
      ctx.textAlign = 'right'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)
      ctx.fillStyle = 'black'
      ctx.fillText(name, width - 20, rowHeight - rowHeight / 4)
    }, [name, width, treeAreaWidth, rowHeight])
    return (
      <canvas
        ref={ref}
        width={width * highResScaleFactor}
        height={rowHeight * highResScaleFactor}
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

const Track = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { rowHeight, treeAreaWidth, resizeHandleWidth } = model
    return (
      <div key={track.id} style={{ display: 'flex', height: rowHeight }}>
        <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
          <TrackLabel model={model} name={track.name} />
        </div>
        <div style={{ width: resizeHandleWidth }} />
        <track.ReactComponent model={model} track={track} />
      </div>
    )
  },
)

export default Track
