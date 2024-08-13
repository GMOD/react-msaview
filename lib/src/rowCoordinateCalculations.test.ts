import { expect, test } from 'vitest'
import { mouseOverCoordToGlobalCoord } from './rowCoordinateCalculations'

// const s1 = 'AA-AA'
//
// test('seq1', () => {
//   expect(globalCoordToRowSpecificSeqCoord(s1, 1)).toBe(1)
//   expect(globalCoordToRowSpecificSeqCoord(s1, 2)).toBe(2)
//   expect(globalCoordToRowSpecificSeqCoord(s1, 3)).toBe(2)
//   expect(globalCoordToRowSpecificSeqCoord(s1, 4)).toBe(3)
//   expect(globalCoordToRowSpecificSeqCoord(s1, 5)).toBe(4)
//   expect(globalCoordToRowSpecificSeqCoord(s1, 6)).toBe(5)
// })
//
// test('blanks1', () => {
//   const blanks = [2]
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 1)).toBe(1)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 2)).toBe(2)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 3)).toBe(4)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 4)).toBe(5)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 5)).toBe(6)
// })
//
// test('combination1', () => {
//   const blanks = [2]
//   expect(globalCoordToRowSpecificCoord(s1, 1, blanks)).toBe(1)
//   expect(globalCoordToRowSpecificCoord(s1, 2, blanks)).toBe(2)
//   expect(globalCoordToRowSpecificCoord(s1, 3, blanks)).toBe(3)
//   expect(globalCoordToRowSpecificCoord(s1, 4, blanks)).toBe(4)
//   expect(globalCoordToRowSpecificCoord(s1, 5, blanks)).toBe(5)
// })
//
// ////////////////////////////////////////
// // vol 2.
// // AAA-B--CC---DDD----EEEEEE
// //
// const s2 = 'AAA-B--CC---DDD----EEEEEE'
// test('blanks2', () => {
//   const blanks = [3, 5, 6, 9, 10, 11, 15, 16, 17, 18]
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 1)).toBe(1)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 2)).toBe(2)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 3)).toBe(4)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 4)).toBe(5)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 5)).toBe(6)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 6)).toBe(7)
//   expect(globalCoordToBlanksIncorporatedCoord(blanks, 7)).toBe(8)
// })
//
// test('combination2', () => {
//   const blanks = [3, 5, 6, 9, 10, 11, 15, 16, 17, 18]
//   expect(globalCoordToRowSpecificCoord(s2, 1, blanks)).toBe(1)
//   expect(globalCoordToRowSpecificCoord(s2, 2, blanks)).toBe(2)
//   expect(globalCoordToRowSpecificCoord(s2, 3, blanks)).toBe(3)
//   expect(globalCoordToRowSpecificCoord(s2, 4, blanks)).toBe(4)
//   expect(globalCoordToRowSpecificCoord(s2, 5, blanks)).toBe(5)
// })

////////////////////////////////////////
// vol 3.
//
// const s3 = 'AA-BB-CC-DD'
test('blanks3', () => {
  const blanks = [2, 5, 8]
  ;[
    [0, 0],
    [1, 1],
    [2, 3],
    [3, 4],
    [4, 6],
    [5, 7],
    [6, 9],
    [7, 10],
  ].forEach(r => expect(mouseOverCoordToGlobalCoord(blanks, r[0])).toBe(r[1]))
})

// test('combination3', () => {
//   const blanks = [2, 5]
//   expect(globalCoordToRowSpecificCoord(s3, 1, blanks)).toBe(1)
//   expect(globalCoordToRowSpecificCoord(s3, 2, blanks)).toBe(2)
//   expect(globalCoordToRowSpecificCoord(s3, 3, blanks)).toBe(3)
//   expect(globalCoordToRowSpecificCoord(s3, 4, blanks)).toBe(4)
//   expect(globalCoordToRowSpecificCoord(s3, 5, blanks)).toBe(5)
// })
