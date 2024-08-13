export function mouseOverCoordToGlobalCoord(blanks: number[], pos: number) {
  let i = 0 // 'mouse over coord'
  let j = 0 // 'position in blanks array'
  let k = 0 // 'global coord'/return value

  for (; i < pos; i++, k++) {
    // skip multiple gaps in a row
    while (blanks[j] - 1 === k) {
      j++
      k++
    }
  }
  return k
}

export function globalCoordToRowSpecificCoord(seq: string, pos: number) {
  let k = 0
  for (let i = 0; i < pos; i++) {
    if (seq[i] !== '-') {
      k++
    } else if (k >= pos) {
      break
    }
  }
  return k
}
