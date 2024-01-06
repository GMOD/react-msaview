import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'
import { autorun } from 'mobx'

function renderMouseover({
  ctx,
  model,
}: {
  ctx: CanvasRenderingContext2D
  model: MsaViewModel
}) {
  const {
    mouseCol,
    colWidth,
    treeAreaWidth,
    resizeHandleWidth,
    width,
    height,
    rowHeight,
    scrollX,
    scrollY,
    mouseRow,
    // @ts-expect-error
    mouseCol2,
    rulerHeight,
    totalTrackAreaHeight,
  } = model
  ctx.resetTransform()
  ctx.clearRect(0, 0, width, height)

  if (mouseCol !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    const x =
      (mouseCol - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth

    ctx.fillRect(x, 0, colWidth, height)
  }

  if (mouseRow !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    const y =
      mouseRow * rowHeight + scrollY + rulerHeight + totalTrackAreaHeight
    ctx.fillRect(treeAreaWidth + resizeHandleWidth, y, width, rowHeight)
  }
  if (mouseCol2 !== undefined) {
    ctx.fillStyle = 'rgba(255,255,0,0.2)'
    const x =
      (mouseCol2 - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth

    ctx.fillRect(x, 0, colWidth, height)
  }
}

const MSAMouseoverCanvas = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { height, width } = model
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) {
      return
    }
    return autorun(() => {
      renderMouseover({ ctx, model })
    })
  }, [model])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    />
  )
})

export default MSAMouseoverCanvas
