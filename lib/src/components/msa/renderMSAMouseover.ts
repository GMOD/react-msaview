import type { MsaViewModel } from '../../model'

const hoverColor = 'rgba(0,0,0,0.15)'
const highlightColor = 'rgba(128,128,0,0.2)'

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
    mouseClickRow,
    mouseClickCol,
  } = model
  ctx.resetTransform()
  ctx.clearRect(0, 0, width, height)
  if (mouseCol !== undefined) {
    ctx.fillStyle = hoverColor
    ctx.fillRect((mouseCol - 1) * colWidth + scrollX, 0, colWidth, height)
  }
  if (mouseRow !== undefined) {
    ctx.fillStyle = hoverColor
    ctx.fillRect(0, mouseRow * rowHeight + scrollY, width, rowHeight)
  }
  if (mouseClickCol !== undefined) {
    ctx.fillStyle = highlightColor
    ctx.fillRect((mouseClickCol - 1) * colWidth + scrollX, 0, colWidth, height)
  }
  if (mouseClickRow !== undefined) {
    ctx.fillStyle = highlightColor
    ctx.fillRect(0, mouseClickRow * rowHeight + scrollY, width, rowHeight)
  }
  if (mouseCol2 !== undefined) {
    ctx.fillStyle = highlightColor
    ctx.fillRect((mouseCol2 - 1) * colWidth + scrollX, 0, colWidth, height)
  }
}
