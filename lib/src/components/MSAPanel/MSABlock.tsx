import React, { useEffect, useRef, useMemo } from 'react'
import { autorun } from 'mobx'
import { useTheme } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { renderBlock } from './renderMSABlock'
import { MsaViewModel } from '../../model'
import { colorContrast } from '../../util'

const MSABlock = observer(function ({
  model,
  offsetX,
  offsetY,
}: {
  model: MsaViewModel
  offsetX: number
  offsetY: number
}) {
  const {
    colWidth,
    rowHeight,
    scrollY,
    scrollX,
    colorScheme,
    blockSize,
    highResScaleFactor,
  } = model
  const theme = useTheme()

  const contrastScheme = useMemo(
    () => colorContrast(colorScheme, theme),
    [colorScheme, theme],
  )

  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) {
      return
    }
    return autorun(() => {
      renderBlock({ ctx, offsetX, offsetY, contrastScheme, model })
    })
  }, [model, offsetX, offsetY, contrastScheme])
  return (
    <canvas
      ref={ref}
      onMouseMove={event => {
        if (!ref.current) {
          return
        }
        const { left, top } = ref.current.getBoundingClientRect()
        const mouseX = event.clientX - left + offsetX
        const mouseY = event.clientY - top + offsetY
        model.setMousePos(
          Math.floor(mouseX / colWidth) + 1,
          Math.floor(mouseY / rowHeight),
        )
      }}
      onMouseLeave={() => model.setMousePos()}
      width={blockSize * highResScaleFactor}
      height={blockSize * highResScaleFactor}
      style={{
        position: 'absolute',
        top: scrollY + offsetY,
        left: scrollX + offsetX,
        width: blockSize,
        height: blockSize,
      }}
    />
  )
})

export default MSABlock
