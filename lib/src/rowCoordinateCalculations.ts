export function globalCoordToBlanksIncorporatedCoord(
  blanks: number[],
  position: number,
) {
  let i = 0
  let j = 0
  while (i++ < position) {
    if (blanks[j] < position) {
      i++
      j++
    } else {
      break
    }
  }
  return i
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
