import { FileLocation } from '@jbrowse/core/util'
import { MsaViewModel } from '../../model'

export async function load(
  model: MsaViewModel,
  msaFile?: FileLocation,
  treeFile?: FileLocation,
) {
  model.setError(undefined)
  try {
    if (msaFile) {
      await model.setMSAFilehandle(msaFile)
    }
    if (treeFile) {
      await model.setTreeFilehandle(treeFile)
    }
  } catch (e) {
    console.error(e)
    model.setError(e)
  }
}
