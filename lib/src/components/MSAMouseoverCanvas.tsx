import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'
import { sum } from '@jbrowse/core/util'

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
    rulerHeight,
    turnedOnTracks,
    scrollX,
    scrollY,
    mouseCol,
    mouseRow,
    rowHeight,
    colWidth,
  } = model
  const totalTrackAreaHeight = sum(turnedOnTracks.map(r => r.model.height))
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

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    if (mouseCol !== undefined) {
      const x =
        (mouseCol - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth

      ctx.fillRect(x, 0, colWidth, height)
    }
    if (mouseRow !== undefined) {
      const y =
        mouseRow * rowHeight + scrollY + rulerHeight + totalTrackAreaHeight
      ctx.fillRect(treeAreaWidth + resizeHandleWidth, y, width, rowHeight)
    }
  }, [
    mouseCol,
    colWidth,
    scrollY,
    totalTrackAreaHeight,
    mouseRow,
    rowHeight,
    rulerHeight,
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
