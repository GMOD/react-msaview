import type { RowCoordinates } from './alignmentSuperposition.ts'
import type { Vec3, CaCoordinates } from './cif.ts'
import type { MsaViewModel } from 'react-msaview'

const GAPS = new Set(['-', '.'])

/**
 * A row's CA positions by alignment column, from the structure the row maps
 * onto: each residue goes through `structureResidue` to its `label_seq_id`,
 * then to the CA the file holds there. A residue with no mapping or no CA is
 * left out, so it joins no fit.
 *
 * Columns are file columns, 0-based, the same space `selection` and
 * `seqPosToGlobalCol` use.
 */
export function rowCoordinates(
  model: MsaViewModel,
  row: string,
  structureId: string,
  coordinates: CaCoordinates,
): RowCoordinates {
  const atColumn = new Map<number, Vec3>()
  const sequence = model.rowSequence(row) ?? ''
  let residue = 0
  for (let column = 0; column < sequence.length; column++) {
    if (GAPS.has(sequence[column]!)) {
      continue
    }
    residue++
    const hit = model.structureResidue(row, residue, structureId)
    if (hit) {
      const chain = hit.structure.asymId
      const residues =
        chain === undefined
          ? coordinates.size === 1
            ? [...coordinates.values()][0]
            : undefined
          : coordinates.get(chain)
      const position = residues?.get(hit.position)
      if (position) {
        atColumn.set(column, position)
      }
    }
  }
  return { row, atColumn }
}
