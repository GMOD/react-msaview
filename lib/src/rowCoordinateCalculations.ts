export function globalCoordToBlanksIncorporatedCoord(
  blanks: number[],
  position: number,
) {
  let i = 0
  let j = 0
  let k = 0
  for (; i < position; i++, k++) {
    if (blanks[j] - 1 === k) {
      j++
      k++
    }
  }
  return k
}

export function globalCoordToRowSpecificSeqCoord(
  seq: string,
  position: number,
) {
  let k = 0
  for (let i = 0; i < position; i++) {
    if (seq[i] !== '-') {
      k++
    } else if (k >= position) {
      break
    }
  }
  return k
}

export function globalCoordToRowSpecificCoord(
  seq: string,
  position: number,
  blanks: number[],
) {
  const position2 = globalCoordToBlanksIncorporatedCoord(blanks, position)
  return globalCoordToRowSpecificSeqCoord(seq, position2)
}
