import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'

const MSAMouseoverCanvas = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const {
    height,
    width,
    treeAreaWidth,
    resizeHandleWidth,
    scrollX,
    scrollY,
    mouseCol,
    mouseRow,
    rowHeight,
    colWidth,
  } = model

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const ctx = ref.current.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.resetTransform()
    ctx.clearRect(0, 0, width, height)

    if (mouseCol !== undefined && mouseRow !== undefined) {
      const x =
        (mouseCol - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth
      const y = mouseRow * rowHeight + scrollY + rowHeight * 3
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(x, 0, colWidth, height)
      ctx.fillRect(treeAreaWidth + resizeHandleWidth, y, width, rowHeight)
    }
  }, [
    mouseCol,
    colWidth,
    scrollY,
    mouseRow,
    rowHeight,
    scrollX,
    height,
    resizeHandleWidth,
    treeAreaWidth,
    width,
  ])

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
