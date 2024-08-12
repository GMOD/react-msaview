import { expect, test } from 'vitest'
import {
  globalCoordToBlanksIncorporatedCoord,
  globalCoordToRowSpecificSeqCoord,
} from './rowCoordinateCalculations'

test('no blanks', () => {
  expect(globalCoordToRowSpecificSeqCoord('AA-AA', 1)).toBe(1)
  expect(globalCoordToRowSpecificSeqCoord('AA-AA', 2)).toBe(2)
  expect(globalCoordToRowSpecificSeqCoord('AA-AA', 3)).toBe(2)
  expect(globalCoordToRowSpecificSeqCoord('AA-AA', 4)).toBe(3)
  expect(globalCoordToRowSpecificSeqCoord('AA-AA', 5)).toBe(4)
})

test('blanks', () => {
  const blanks = [3]
  expect(globalCoordToBlanksIncorporatedCoord(blanks, 1)).toBe(1)
  expect(globalCoordToBlanksIncorporatedCoord(blanks, 2)).toBe(2)
  expect(globalCoordToBlanksIncorporatedCoord(blanks, 3)).toBe(2)
  expect(globalCoordToBlanksIncorporatedCoord(blanks, 4)).toBe(3)
  expect(globalCoordToBlanksIncorporatedCoord(blanks, 5)).toBe(4)
})
