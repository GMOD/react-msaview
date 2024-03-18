import { FileLocation } from '@jbrowse/core/util'
import { MsaViewModel } from '../../model'

export async function load(
  model: MsaViewModel,
  msaFile?: FileLocation,
  treeFile?: FileLocation,
) {
  model.setError(undefined)
  if (msaFile) {
    model.setMSAFilehandle(msaFile)
  }
  if (treeFile) {
    model.setTreeFilehandle(treeFile)
  }
}
