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
    width,
    height,
    rowHeight,
    scrollX,
    scrollY,
    mouseRow,
    // @ts-expect-error
    mouseCol2,
  } = model
  ctx.resetTransform()
  ctx.clearRect(0, 0, width, height)
  if (mouseCol !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect((mouseCol - 1) * colWidth + scrollX, 0, colWidth, height)
  }
  if (mouseRow !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(0, mouseRow * rowHeight + scrollY, width, rowHeight)
  }
  if (mouseCol2 !== undefined) {
    ctx.fillStyle = 'rgba(255,255,0,0.2)'
    ctx.fillRect((mouseCol2 - 1) * colWidth + scrollX, 0, colWidth, height)
  }
}
