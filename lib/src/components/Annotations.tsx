import React, { useRef, useMemo, useEffect } from 'react'
import { useTheme } from '@material-ui/core'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

const AnnotationBlock = observer(
  ({ model, offsetX }: { model: MsaViewModel; offsetX: number }) => {
    const {
      blockSize,
      scrollX,
      seqConsensus,
      bgColor,
      colorScheme,
      colWidth,
      rowHeight,
    } = model
    const theme = useTheme()
    const ref = useRef<HTMLCanvasElement>(null)
    const colorContrast = useMemo(
      () => model.colorContrast(theme),
      [model, theme],
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
      ctx.clearRect(0, 0, blockSize, rowHeight)
      ctx.translate(-offsetX, 0)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 12)}px`)

      const b = blockSize
      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      const xEnd = Math.max(0, Math.ceil((offsetX + b) / colWidth))
      const str = seqConsensus?.slice(xStart, xEnd)
      for (let i = 0; str && i < str.length; i++) {
        const letter = str[i]
        const color = colorScheme[letter.toUpperCase()]
        if (bgColor) {
          const x = i * colWidth + offsetX - (offsetX % colWidth)
          ctx.fillStyle = color || 'white'
          ctx.fillRect(x, 0, colWidth, rowHeight)
          ctx.fillStyle = colorContrast[letter.toUpperCase()]
          ctx.fillText(letter, x + colWidth / 2, rowHeight / 2)
        }
      }
    }, [
      bgColor,
      blockSize,
      colWidth,
      rowHeight,
      offsetX,
      seqConsensus,
      colorScheme,
      colorContrast,
    ])
    return (
      <canvas
        ref={ref}
        height={rowHeight}
        width={blockSize}
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
const AnnotationTrack = observer(({ model }: { model: MsaViewModel }) => {
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
      {blocksX.map((bx) => (
        <AnnotationBlock key={bx} model={model} offsetX={bx} />
      ))}
    </div>
  )
})

export default AnnotationTrack
