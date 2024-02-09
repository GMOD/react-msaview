import { MsaViewModel } from '../../model'

export function renderMouseover({
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
    minimapHeight,
    totalTrackAreaHeight,
  } = model
  ctx.resetTransform()
  ctx.clearRect(0, 0, width, height)

  if (mouseCol !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    const x =
      (mouseCol - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth

    ctx.fillRect(x, minimapHeight, colWidth, height)
  }

  if (mouseRow !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    const y =
      mouseRow * rowHeight + scrollY + minimapHeight + totalTrackAreaHeight
    ctx.fillRect(treeAreaWidth + resizeHandleWidth, y, width, rowHeight)
  }
  if (mouseCol2 !== undefined) {
    ctx.fillStyle = 'rgba(255,255,0,0.2)'
    const x =
      (mouseCol2 - 1) * colWidth + scrollX + treeAreaWidth + resizeHandleWidth

    ctx.fillRect(x, 0, colWidth, height)
  }
}
