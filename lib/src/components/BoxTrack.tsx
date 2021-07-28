import React, { useRef, useMemo, useEffect } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import Layout from '../layout'

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
      colWidth,
      blanks,
      rowHeight,
      highResScaleFactor,
      scrollX,
    } = model
    const { name, data, height, features, associatedRowName } = track

    const layout = useMemo(() => {
      const temp = new Layout()
      features?.forEach(([feature]: any, index: number) => {
        const s = model.bpToPx(name, feature.start - 1)
        const e = model.bpToPx(name, feature.end)
        temp.addRect(`${index}`, s, e, rowHeight, feature)
      })
      return temp
    }, [rowHeight, features, associatedRowName, model, blanks])

    const ref = useRef<HTMLCanvasElement>(null)
    const labelRef = useRef<HTMLCanvasElement>(null)
    const mouseoverRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      if (!ref.current) {
        return
      }

      const ctx = ref.current.getContext('2d')
      if (!ctx) {
        return
      }

      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
      ctx.clearRect(0, 0, blockSize, height)
      ctx.translate(-offsetX, 0)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      ctx.fillStyle = 'goldenrod'
      layout.rectangles.forEach(value => {
        const { minX, maxX, minY, maxY } = value

        const x1 = (minX - xStart) * colWidth + offsetX - (offsetX % colWidth)
        const x2 = (maxX - xStart) * colWidth + offsetX - (offsetX % colWidth)

        if (x2 - x1 > 0) {
          ctx.fillRect(x1, minY, x2 - x1, (maxY - minY) / 2)
        }
      })
    }, [
      associatedRowName,
      blockSize,
      colWidth,
      layout.rectangles,
      model,
      rowHeight,
      height,
      offsetX,
      highResScaleFactor,
      features,
      blanks,
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
      ctx.clearRect(0, 0, blockSize, height)
      ctx.translate(-offsetX, 0)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

      ctx.fillStyle = 'black'
      ctx.textAlign = 'left'
      layout.rectangles.forEach(value => {
        const { minX, maxX, maxY, minY } = value
        const feature = value.data as any

        const x1 = minX * colWidth
        const x2 = maxX * colWidth

        if (x2 - x1 > 0) {
          const note = feature.attributes?.Note?.[0]
          ctx.fillText(
            `${feature.type}${note ? ` - ${note}` : ''}`,
            Math.max(Math.min(-scrollX, x2), x1),
            minY + (maxY - minY),
          )
        }
      })
    }, [
      blockSize,
      colWidth,
      scrollX,
      highResScaleFactor,
      height,
      layout.rectangles,
      offsetX,
      features,
      model,
      rowHeight,
      blanks,
    ])

    return !data ? null : (
      <>
        <canvas
          ref={ref}
          height={height * highResScaleFactor}
          width={blockSize * highResScaleFactor}
          style={{
            position: 'absolute',
            left: scrollX + offsetX,
            width: blockSize,
            height,
          }}
        />
        <canvas
          ref={labelRef}
          height={height * highResScaleFactor}
          width={blockSize * highResScaleFactor}
          style={{
            position: 'absolute',
            left: scrollX + offsetX,
            width: blockSize,
            height,
          }}
        />
        <canvas
          ref={mouseoverRef}
          height={height * highResScaleFactor}
          width={blockSize * highResScaleFactor}
          style={{
            position: 'absolute',
            left: scrollX + offsetX,
            width: blockSize,
            height,
          }}
        />
      </>
    )
  },
)
const AnnotationTrack = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { blocksX, msaAreaWidth } = model
    const { height } = track
    return (
      <div
        style={{
          position: 'relative',
          height,
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
