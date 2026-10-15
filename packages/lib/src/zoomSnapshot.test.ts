import { expect, test } from 'vitest'

import { takeZoomSnapshot, zoomSnapshotCovers } from './zoomSnapshot.ts'

const numColumns = 3000
const numRows = 2000

// zooms a 1000x600 viewport by `s` about its center, from 10px cells scrolled
// to the middle of the alignment
function view(s: number) {
  const colWidth = 10 * s
  const rowHeight = 10 * s
  const centerCol = numColumns / 2
  const centerRow = numRows / 2
  return {
    colWidth,
    rowHeight,
    scrollX: 500 - centerCol * colWidth,
    scrollY: 300 - centerRow * rowHeight,
    msaAreaWidth: 1000,
    msaAreaHeight: 600,
    totalWidth: numColumns * colWidth,
    totalHeight: numRows * rowHeight,
    blockSize: 500,
  }
}

test('the blocks drawn at the snapshot cover a zoom in', () => {
  const snap = takeZoomSnapshot(view(1), false)
  expect(zoomSnapshotCovers(view(1), snap)).toBe(true)
  expect(zoomSnapshotCovers(view(1.5), snap)).toBe(true)
})

test('a zoom in past twice the snapshot redraws for sharpness', () => {
  const snap = takeZoomSnapshot(view(1), false)
  expect(zoomSnapshotCovers(view(2.5), snap)).toBe(false)
})

test('a zoom out runs out of picture, later with the margin', () => {
  expect(zoomSnapshotCovers(view(0.9), takeZoomSnapshot(view(1), false))).toBe(
    false,
  )
  expect(zoomSnapshotCovers(view(0.9), takeZoomSnapshot(view(1), true))).toBe(
    true,
  )
})

test('a snapshot of an alignment smaller than the viewport covers its zoom out', () => {
  const small = (colWidth: number) => ({
    ...view(1),
    colWidth,
    rowHeight: colWidth,
    scrollX: 0,
    scrollY: 0,
    totalWidth: 40 * colWidth,
    totalHeight: 30 * colWidth,
  })
  expect(zoomSnapshotCovers(small(5), takeZoomSnapshot(small(10), false))).toBe(
    true,
  )
})
