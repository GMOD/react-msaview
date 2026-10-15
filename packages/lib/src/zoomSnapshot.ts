import { calculateBlocks } from './calculateBlocks.ts'

export interface ZoomSnapshot {
  colWidth: number
  rowHeight: number
  blocksX: number[]
  blocksY: number[]
}

interface Viewport {
  colWidth: number
  rowHeight: number
  scrollX: number
  scrollY: number
  msaAreaWidth: number
  msaAreaHeight: number
  totalWidth: number
  totalHeight: number
  blockSize: number
}

// past this stretch the scaled letters blur enough to redraw
const maxStretch = 2

// a redraw covers this fraction of the viewport again on each side, so a zoom
// out shrinks it for a few frames before it runs out of picture
const margin = 0.2

function blocksAt(
  view: Viewport,
  axis: 'x' | 'y',
  scale: number,
  marginFraction: number,
) {
  const size = axis === 'x' ? view.msaAreaWidth : view.msaAreaHeight
  const pos = -(axis === 'x' ? view.scrollX : view.scrollY)
  const map = axis === 'x' ? view.totalWidth : view.totalHeight
  const pad = size * marginFraction
  return calculateBlocks({
    viewportSize: (size + 2 * pad) / scale,
    viewportPos: (pos - pad) / scale,
    mapSize: map / scale,
    blockSize: view.blockSize,
  })
}

const within = (need: number[], have: number[]) =>
  need.length === 0 ||
  (have.length > 0 && need[0]! >= have[0]! && need.at(-1)! <= have.at(-1)!)

// a gesture starts from the blocks already drawn, and each redraw during it
// adds the margin
export function takeZoomSnapshot(view: Viewport, withMargin: boolean) {
  const m = withMargin ? margin : 0
  return {
    colWidth: view.colWidth,
    rowHeight: view.rowHeight,
    blocksX: blocksAt(view, 'x', 1, m),
    blocksY: blocksAt(view, 'y', 1, m),
  } satisfies ZoomSnapshot
}

export function zoomSnapshotScale(view: Viewport, snap: ZoomSnapshot) {
  return {
    sx: view.colWidth / snap.colWidth,
    sy: view.rowHeight / snap.rowHeight,
  }
}

// whether the blocks drawn at the snapshot, stretched to the current cell
// size, still fill the viewport sharply enough
export function zoomSnapshotCovers(view: Viewport, snap: ZoomSnapshot) {
  const { sx, sy } = zoomSnapshotScale(view, snap)
  return (
    sx <= maxStretch &&
    sy <= maxStretch &&
    within(blocksAt(view, 'x', sx, 0), snap.blocksX) &&
    within(blocksAt(view, 'y', sy, 0), snap.blocksY)
  )
}
