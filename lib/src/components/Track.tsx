import React, { useRef, useEffect } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

export const TrackLabel = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const { rowHeight, treeAreaWidth: width, highResScaleFactor } = model
    const { height, name } = track

    useEffect(() => {
      const canvas = ref.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
      ctx.clearRect(0, 0, width, height)
      ctx.textAlign = 'right'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)
      ctx.fillStyle = 'black'
      ctx.textBaseline = 'hanging'
      ctx.fillText(name, width - 20, 0)
    }, [name, width, rowHeight, height, highResScaleFactor])
    return (
      <canvas
        ref={ref}
        width={width * highResScaleFactor}
        height={height * highResScaleFactor}
        style={{
          width,
          height,
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    )
  },
)

const Track = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { resizeHandleWidth } = model
    const { height } = track
    return (
      <div key={track.id} style={{ display: 'flex', height }}>
        <TrackLabel model={model} track={track} />
        <div style={{ width: resizeHandleWidth }} />
        <track.ReactComponent model={model} track={track} />
      </div>
    )
  },
)

export default Track
