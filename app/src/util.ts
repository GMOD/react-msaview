import { Structure } from 'ngl'
import { AppModel } from './model'

export function getOffset(
  model: AppModel,
  rowName: string,
  structure: Structure,
  mouseCol: number,
  startPos: number,
) {
  const rn = structure.residueStore.count
  const rp = structure.getResidueProxy()
  const pos = model.msaview.relativePxToBp(rowName, mouseCol)
  for (let i = 0; i < rn; ++i) {
    rp.index = i
    if (rp.resno === pos + startPos - 1) {
      return rp
    }
  }
}
