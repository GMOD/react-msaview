import React, { useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@mui/material'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'

// locals
import { renderMSABlock } from './renderMSABlock'
import type { MsaViewModel } from '../../model'
import { colorContrast } from '../../util'
import { renderBoxFeatureCanvasBlock } from './renderBoxFeatureCanvasBlock'

const MSACanvasBlock = observer(function ({
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
    mouseClickCol,
    mouseClickRow,
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
      ctx.resetTransform()
      ctx.clearRect(0, 0, blockSize, blockSize)
      if (model.showDomains) {
        renderBoxFeatureCanvasBlock({
          ctx,
          offsetX,
          offsetY,
          model,
        })
      }
      renderMSABlock({
        ctx,
        theme,
        offsetX,
        offsetY,
        contrastScheme,
        model,
      })
    })
  }, [model, offsetX, offsetY, theme, blockSize, contrastScheme])

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
        const x = Math.floor(mouseX / colWidth) + 1
        const y = Math.floor(mouseY / rowHeight)
        model.setMousePos(x, y)
      }}
      onClick={event => {
        if (!ref.current) {
          return
        }
        const { left, top } = ref.current.getBoundingClientRect()
        const mouseX = event.clientX - left + offsetX
        const mouseY = event.clientY - top + offsetY
        const x = Math.floor(mouseX / colWidth) + 1
        const y = Math.floor(mouseY / rowHeight)
        if (x === mouseClickCol && y === mouseClickRow) {
          model.setMouseClickPos(undefined, undefined)
        } else {
          model.setMouseClickPos(x, y)
        }
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

export default MSACanvasBlock
