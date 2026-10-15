import { applyMatrix, distance, fitRigid } from './superpose.ts'

import type { Vec3 } from './cif.ts'
import type { Mat4 } from './superpose.ts'

/** a row's CA positions by alignment column, for the residues it has */
export interface RowCoordinates {
  row: string
  /** carried to the fit, so two targets for one row stay apart */
  id?: string
  atColumn: Map<number, Vec3>
}

export interface RowSuperposition {
  row: string
  id?: string
  /** the CA pairs the fit used */
  fitted: number
  rmsd: number
  /** moves this row's structure into the reference's frame */
  matrix: Mat4
  /**
   * CA-CA distance in Å by column after the fit, for every column where both
   * rows have a CA, whether or not the fit used it
   */
  distances: Map<number, number>
}

export interface SuperpositionResult {
  fits: RowSuperposition[]
  skipped: { row: string; reason: string }[]
}

/**
 * Lays each row's structure on the reference's using the columns where both
 * have a CA, so the alignment says which residues correspond. `fitColumns`
 * picks the columns the fit uses, such as a selected pocket, and the distances
 * come out for every shared column, which is how a pocket's fit shows where the
 * rest of the fold departs from it.
 */
export function superposeOnColumns(
  reference: RowCoordinates,
  others: RowCoordinates[],
  fitColumns: (column: number) => boolean = () => true,
): SuperpositionResult {
  const fits: RowSuperposition[] = []
  const skipped: SuperpositionResult['skipped'] = []
  for (const other of others) {
    const moving: Vec3[] = []
    const fixed: Vec3[] = []
    for (const [column, position] of other.atColumn) {
      const target = reference.atColumn.get(column)
      if (target && fitColumns(column)) {
        moving.push(position)
        fixed.push(target)
      }
    }
    const fit = fitRigid(moving, fixed)
    if (!fit) {
      skipped.push({
        row: other.row,
        reason: `${moving.length} aligned residues with coordinates in the chosen columns, and a fit takes three`,
      })
      continue
    }
    const distances = new Map<number, number>()
    for (const [column, position] of other.atColumn) {
      const target = reference.atColumn.get(column)
      if (target) {
        distances.set(
          column,
          distance(applyMatrix(fit.matrix, position), target),
        )
      }
    }
    fits.push({
      row: other.row,
      id: other.id,
      fitted: moving.length,
      rmsd: fit.rmsd,
      matrix: fit.matrix,
      distances,
    })
  }
  return { fits, skipped }
}

/**
 * One number per residue of the reference row: the mean CA distance to the
 * superposed rows that have a CA in that column, or 0 where none does. Its
 * length is `referenceColumns`', which lists the column of each residue of the
 * row in order, so the array is a `columnTracks` bar's `values`.
 */
export function meanColumnDistances(
  fits: RowSuperposition[],
  referenceColumns: number[],
) {
  return referenceColumns.map(column => {
    let sum = 0
    let n = 0
    for (const fit of fits) {
      const d = fit.distances.get(column)
      if (d !== undefined) {
        sum += d
        n++
      }
    }
    return n === 0 ? 0 : Math.round((sum / n) * 100) / 100
  })
}
