import type { MsaViewModel } from '../../model.ts'

export const MINIMAP_BAR_HEIGHT = 12

/**
 * Viewport-rectangle and trapezoid geometry for the minimap, shared by the
 * interactive Minimap and the static MinimapSVG. Both span the alignment canvas
 * exactly -- a minimap drawn a different width than the columns it maps puts
 * its viewport rectangle over the wrong ones.
 */
export function getMinimapLayout(model: MsaViewModel) {
  const { scrollX, minimapHeight, totalWidth, msaCanvasWidth } = model
  const unit = totalWidth > 0 ? msaCanvasWidth / totalWidth : 0
  const s = -scrollX * unit
  // the rectangle marks the visible slice of the alignment, so it can never be
  // wider than the bar itself
  const w = Math.min(msaCanvasWidth, Math.max(msaCanvasWidth * unit, 20))
  const polygonHeight = minimapHeight - MINIMAP_BAR_HEIGHT
  const polygonPoints = `${s + w},0 ${s},0 0,${polygonHeight} ${msaCanvasWidth},${polygonHeight}`
  return { unit, s, w, polygonHeight, polygonPoints }
}

/**
 * The domain overlay's boxes scaled onto the minimap bar, one per row's band,
 * in the colors the alignment draws them, so the overview shows the domains
 * the alignment does. Empty unless the domains fill the cells.
 */
export function minimapDomainRects(
  model: MsaViewModel,
  width: number,
  height: number,
) {
  const { cellFill, domainBands, featureColors, leaves, numColumns } = model
  if (cellFill !== 'domain' || numColumns <= 0 || leaves.length === 0) {
    return []
  }
  const colUnit = width / numColumns
  const rowUnit = height / leaves.length
  return leaves.flatMap((leaf, row) =>
    (domainBands.get(leaf.data.name) ?? []).map(band => ({
      x: band.startCol * colUnit,
      y: row * rowUnit,
      w: Math.max(1, (band.endCol - band.startCol) * colUnit),
      h: Math.max(1, rowUnit),
      fill: featureColors.get(band.annotation)?.fill ?? 'grey',
    })),
  )
}
