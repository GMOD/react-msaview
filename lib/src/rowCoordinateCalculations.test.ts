import { expect, test } from 'vitest'

import { mouseOverCoordToGlobalCoord } from './rowCoordinateCalculations'
test('blanks3', () => {
  const blanks = [2, 5, 8]
  ;(
    [
      [0, 0],
      [1, 1],
      [2, 3],
      [3, 4],
      [4, 6],
      [5, 7],
      [6, 9],
      [7, 10],
    ] as const
  ).forEach(r => {
    expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1])
  })
})
