import { expect, test } from 'vitest'

import {
  globalCoordToRowSpecificCoord,
  mouseOverCoordToGlobalCoord,
} from './rowCoordinateCalculations'

test('with blanks at positions [2, 5, 8]', () => {
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

test('with no blanks', () => {
  const blanks: number[] = []
  ;(
    [
      [0, 0],
      [1, 1],
      [5, 5],
      [10, 10],
    ] as const
  ).forEach(r => {
    expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1])
  })
})

test('with consecutive blanks', () => {
  const blanks = [2, 3, 4, 7, 8]
  ;(
    [
      [0, 0],
      [1, 1],
      [2, 5], // After position 1, skip 3 blanks (2,3,4)
      [3, 6], // Next position
      [4, 9], // After position 3, skip 2 blanks (7,8)
      [5, 10],
    ] as const
  ).forEach(r => {
    expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1])
  })
})

test('with blanks at the beginning', () => {
  const blanks = [1, 2, 5]
  ;(
    [
      [0, 0],
      [1, 3], // After position 0, skip 2 blanks (1,2)
      [2, 4],
      [3, 6], // After position 2, skip 1 blank (5)
      [4, 7],
    ] as const
  ).forEach(r => {
    expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1])
  })
})

test('with position exceeding blanks array', () => {
  const blanks = [2, 5]
  ;(
    [
      [0, 0],
      [1, 1],
      [2, 3], // After position 1, skip 1 blank (2)
      [3, 4],
      [4, 6], // After position 3, skip 1 blank (5)
      [10, 12], // Far beyond blanks array
    ] as const
  ).forEach(r => {
    expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1])
  })
})

test('with gaps in sequence', () => {
  const sequence = 'AC-GT-A'
  expect(globalCoordToRowSpecificCoord(sequence, 0)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 1)).toBe(1)
  expect(globalCoordToRowSpecificCoord(sequence, 2)).toBe(2)
  // Position 3 in global coordinates is after the gap
  expect(globalCoordToRowSpecificCoord(sequence, 3)).toBe(2)
  expect(globalCoordToRowSpecificCoord(sequence, 4)).toBe(3)
  expect(globalCoordToRowSpecificCoord(sequence, 5)).toBe(4)
  // Position 6 in global coordinates is after the gap
  expect(globalCoordToRowSpecificCoord(sequence, 6)).toBe(4)
})

test('with no gaps in sequence', () => {
  const sequence = 'ACGTA'
  expect(globalCoordToRowSpecificCoord(sequence, 0)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 1)).toBe(1)
  expect(globalCoordToRowSpecificCoord(sequence, 2)).toBe(2)
  expect(globalCoordToRowSpecificCoord(sequence, 3)).toBe(3)
  expect(globalCoordToRowSpecificCoord(sequence, 4)).toBe(4)
})

test('with all gaps in sequence', () => {
  const sequence = '-----'
  expect(globalCoordToRowSpecificCoord(sequence, 0)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 1)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 2)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 3)).toBe(0)
  expect(globalCoordToRowSpecificCoord(sequence, 4)).toBe(0)
})

test('with position exceeding sequence length', () => {
  const sequence = 'AC-GT'
  expect(globalCoordToRowSpecificCoord(sequence, 10)).toBe(4)
})
