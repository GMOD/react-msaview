import React, { useRef, useEffect } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import RBush from 'rbush'

function getLayout(data) {
  const rbush = new RBush()
}
const AnnotationBlock = observer(
  ({
    track,
    model,
    offsetX,
  }: {
    track: any
    model: MsaViewModel
    offsetX: number
  }) => {
    const {
      blockSize,
      colorScheme: modelColorScheme,
      colWidth,
      rowHeight,
      highResScaleFactor,
      scrollX,
    } = model
    const { customColorScheme, rowName, data } = track

    const colorScheme = customColorScheme || modelColorScheme
    const ref = useRef<HTMLCanvasElement>(null)
    const labelRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      if (!ref.current) {
        return
      }

      const ctx = ref.current.getContext('2d')
      if (!ctx) {
        return
      }

      // this logic is very similar to MSACanvas
      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
      ctx.clearRect(0, 0, blockSize, rowHeight)
      ctx.translate(-offsetX, 0)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      ctx.fillStyle = 'goldenrod'
      data.forEach(([feature]) => {
        const s = model.bpToPx(rowName, feature.start)
        const e = model.bpToPx(rowName, feature.end)

        const x1 = (s - xStart) * colWidth + offsetX - (offsetX % colWidth)
        const x2 = (e - xStart) * colWidth + offsetX - (offsetX % colWidth)

        if (x2 - x1 > 0) {
          ctx.fillRect(x1, 0, x2 - x1, rowHeight / 2)
        }
      })
    }, [
      rowName,
      blockSize,
      colWidth,
      model,
      rowHeight,
      offsetX,
      highResScaleFactor,
      data,
    ])

    useEffect(() => {
      if (!labelRef.current) {
        return
      }

      const ctx = labelRef.current.getContext('2d')
      if (!ctx) {
        return
      }

      // this logic is very similar to MSACanvas
      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
      ctx.clearRect(0, 0, blockSize, rowHeight)
      ctx.translate(-offsetX, 0)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      data.forEach(([feature]) => {
        const note = feature.attributes.Note?.[0]
        const s = model.bpToPx(rowName, feature.start)
        const e = model.bpToPx(rowName, feature.end)

        const x1 = (s - xStart) * colWidth + offsetX - (offsetX % colWidth)
        const x2 = (e - xStart) * colWidth + offsetX - (offsetX % colWidth)

        if (x2 - x1 > 0) {
          ctx.fillStyle = 'black'
          ctx.fillText(
            `${feature.type}${note ? ` - ${note}` : ''}`,
            Math.max(scrollX - offsetX, x1),
            rowHeight,
          )
        }
      })
    }, [
      blockSize,
      colWidth,
      scrollX,
      highResScaleFactor,
      offsetX,
      rowName,
      data,
      model,
      rowHeight,
    ])

    return !data ? null : (
      <>
        <canvas
          ref={ref}
          height={rowHeight * highResScaleFactor}
          width={blockSize * highResScaleFactor}
          style={{
            position: 'absolute',
            left: scrollX + offsetX,
            width: blockSize,
            height: rowHeight,
          }}
        />
        <canvas
          ref={labelRef}
          height={rowHeight * highResScaleFactor}
          width={blockSize * highResScaleFactor}
          style={{
            position: 'absolute',
            left: scrollX + offsetX,
            width: blockSize,
            height: rowHeight,
          }}
        />
      </>
    )
  },
)
const AnnotationTrack = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { blocksX, msaAreaWidth, rowHeight } = model
    return (
      <div
        style={{
          position: 'relative',
          height: rowHeight,
          width: msaAreaWidth,
          overflow: 'hidden',
        }}
      >
        {blocksX.map(bx => (
          <AnnotationBlock track={track} key={bx} model={model} offsetX={bx} />
        ))}
      </div>
    )
  },
)

export default AnnotationTrack
