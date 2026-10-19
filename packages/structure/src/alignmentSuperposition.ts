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
  /** the CA pairs the final fit used */
  fitted: number
  /** the pairs the alignment offered before any were set aside */
  considered: number
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

export interface Refinement {
  /**
   * a pair farther than this many times the fit's RMSD is set aside, so the
   * threshold tightens as the fit improves
   */
  cutoff: number
  /** a pair under this distance in Å is never set aside */
  minDistance: number
  /** at most this many rounds of fit and set aside */
  rounds: number
  /** the fit keeps at least this many pairs, and 40% of those offered */
  minPairs: number
}

/** PyMOL's `align` defaults (cutoff 2 RMS, 5 cycles), with a floor so a loose alignment cannot empty the fit */
const defaultRefinement: Refinement = {
  cutoff: 2,
  minDistance: 1.5,
  rounds: 5,
  minPairs: 12,
}

/**
 * A fit that sets aside the pairs a first fit leaves far apart and fits again,
 * so a loop the alignment mismatched or a hinge that moved does not pull the
 * core out of register. The distances reported afterwards still cover every
 * shared column, so what was set aside shows as a large distance.
 */
function refinedFit(
  moving: Vec3[],
  fixed: Vec3[],
  refinement: Refinement | false,
) {
  let used = moving.map((_, i) => i)
  let fit = fitRigid(moving, fixed)
  if (!fit || refinement === false) {
    return fit && { fit, used }
  }
  const floor = Math.max(refinement.minPairs, Math.ceil(moving.length * 0.4))
  for (let round = 0; round < refinement.rounds; round++) {
    const current = fit
    const limit = Math.max(
      refinement.cutoff * current.rmsd,
      refinement.minDistance,
    )
    const keep = used.filter(
      i =>
        distance(applyMatrix(current.matrix, moving[i]!), fixed[i]!) <= limit,
    )
    if (keep.length === used.length || keep.length < floor) {
      break
    }
    const next = fitRigid(
      keep.map(i => moving[i]!),
      keep.map(i => fixed[i]!),
    )
    if (!next) {
      break
    }
    used = keep
    fit = next
  }
  return { fit, used }
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
  refinement: Refinement | false = defaultRefinement,
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
    const refined = refinedFit(moving, fixed, refinement)
    if (!refined) {
      skipped.push({
        row: other.row,
        reason: `${moving.length} aligned residues with coordinates in the chosen columns, and a fit takes three`,
      })
      continue
    }
    const { fit, used } = refined
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
      fitted: used.length,
      considered: moving.length,
      rmsd: fit.rmsd,
      matrix: fit.matrix,
      distances,
    })
  }
  return { fits, skipped }
}

/**
 * One number per residue of the reference row: the mean CA distance to the
 * superposed rows that have a CA in that column, or 0 where none does, since
 * a bar track reads 0 as no bar and its tooltip cannot show a missing value. Its
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
