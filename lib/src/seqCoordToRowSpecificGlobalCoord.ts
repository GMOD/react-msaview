import { isBlank } from './util'

export function seqCoordToRowSpecificGlobalCoord({
  row,
  position,
}: {
  row: string
  position: number
}) {
  let k = 0
  let i = 0
  for (; k < position; i++) {
    if (!isBlank(row[i])) {
      k++
    } else if (k >= position) {
      break
    }
  }
  return i
}
