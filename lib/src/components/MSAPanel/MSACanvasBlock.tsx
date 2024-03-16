import React, { useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@mui/material'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'

// locals
import { renderMSABlock } from './renderMSABlock'
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
    return ctx
      ? autorun(() => {
          renderMSABlock({
            ctx,
            theme,
            offsetX,
            offsetY,
            contrastScheme,
            model,
          })
        })
      : undefined
  }, [model, offsetX, offsetY, theme, contrastScheme])
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

export default MSABlock