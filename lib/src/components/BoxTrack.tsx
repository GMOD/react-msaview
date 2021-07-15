import React, { useRef, useMemo, useEffect } from 'react'
import { useTheme } from '@material-ui/core'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import { colorContrast } from '../util'

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
      scrollX,
      bgColor,
      colorScheme: modelColorScheme,
      colWidth,
      rowHeight,
      highResScaleFactor,
    } = model
    const { customColorScheme, rowName, data } = track

    const colorScheme = customColorScheme || modelColorScheme
    const theme = useTheme()
    const ref = useRef<HTMLCanvasElement>(null)
    const contrastScheme = useMemo(
      () => colorContrast(colorScheme, theme),
      [colorScheme, theme],
    )

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

      const b = blockSize
      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      data.slice(0, 10).forEach(([feature]) => {
        const s = model.bpToPx(rowName, feature.start)
        const e = model.bpToPx(rowName, feature.end)

        const x1 = (s - xStart) * colWidth + offsetX - (offsetX % colWidth)
        const x2 = (e - xStart) * colWidth + offsetX - (offsetX % colWidth)

        if (x2 - x1 > 0) {
          ctx.fillStyle = 'red'
          ctx.fillRect(x1, 0, x2 - x1, rowHeight / 2)
          ctx.fillStyle = 'black'
          ctx.fillText(
            `${feature.type} - ${feature.attributes.Note[0]}`,
            x1,
            rowHeight,
          )
        }
      })
    }, [
      bgColor,
      rowName,
      blockSize,
      colWidth,
      model,
      rowHeight,
      offsetX,
      contrastScheme,
      colorScheme,
      highResScaleFactor,
      data,
    ])
    return !data ? null : (
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
