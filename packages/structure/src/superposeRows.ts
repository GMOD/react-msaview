import {
  meanColumnDistances,
  superposeOnColumns,
} from './alignmentSuperposition.ts'
import { parseCaCoordinates } from './cif.ts'
import { rowCoordinates } from './rowCoordinates.ts'

import type {
  RowCoordinates,
  RowSuperposition,
} from './alignmentSuperposition.ts'
import type { CaCoordinates } from './cif.ts'
import type { Mat4 } from './superpose.ts'
import type { MsaViewModel } from 'react-msaview'

export interface SuperposeTarget {
  row: string
  structureId: string
}

export interface SuperposeRowsResult {
  /** the structure that stays put, and the matrix for each of the others */
  referenceId: string
  matrices: Record<string, Mat4>
  fits: (RowSuperposition & { structureId: string })[]
  /** CA distance per residue of the reference row, a `columnTracks` bar */
  distanceValues: number[]
  /** rows left out, and why */
  skipped: { row: string; reason: string }[]
}

export type FetchText = (url: string) => Promise<string>

const fetchText: FetchText = async url => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${url}: HTTP ${res.status}`)
  }
  return res.text()
}

/**
 * Superposes the structures of several rows by the alignment. The first target
 * is the reference. Each other row's structure is fitted on the columns where
 * both rows have a CA, limited to `columns` when given, and the CA distance per
 * residue of the reference row comes back as the values of a bar track.
 *
 * Structure files are read as mmCIF; one in another format is skipped with a
 * reason, as is a row that shares a structure with the reference.
 */
export async function superposeRows({
  model,
  targets,
  columns,
  fetchText: read = fetchText,
}: {
  model: MsaViewModel
  targets: SuperposeTarget[]
  /** file columns, 0-based, inclusive; every column when unset */
  columns?: { start: number; end: number }
  fetchText?: FetchText
}): Promise<SuperposeRowsResult> {
  const [reference, ...rest] = targets
  if (!reference) {
    throw new Error('Pick at least two rows that map onto structures')
  }
  const urlOf = (structureId: string) =>
    model.mappedStructures.find(m => m.structure.id === structureId)?.structure
      .url
  const cache = new Map<string, Promise<CaCoordinates | undefined>>()
  const coordinatesOf = (structureId: string) => {
    const url = urlOf(structureId)
    if (!url) {
      return Promise.resolve(undefined)
    }
    let found = cache.get(url)
    if (!found) {
      found = read(url).then(parseCaCoordinates)
      cache.set(url, found)
    }
    return found
  }

  const skipped: SuperposeRowsResult['skipped'] = []
  const refCoordinates = await coordinatesOf(reference.structureId)
  if (!refCoordinates) {
    throw new Error(
      `${reference.structureId} is not an mmCIF file the page can read`,
    )
  }
  const referenceRow = rowCoordinates(
    model,
    reference.row,
    reference.structureId,
    refCoordinates,
  )

  const others: { structureId: string; coordinates: RowCoordinates }[] = []
  const seen = new Set([reference.structureId])
  for (const target of rest) {
    if (seen.has(target.structureId)) {
      skipped.push({
        row: target.row,
        reason: `${target.structureId} is already in the superposition`,
      })
      continue
    }
    const coordinates = await coordinatesOf(target.structureId)
    if (!coordinates) {
      skipped.push({
        row: target.row,
        reason: `${target.structureId} is not an mmCIF file the page can read`,
      })
      continue
    }
    seen.add(target.structureId)
    others.push({
      structureId: target.structureId,
      coordinates: rowCoordinates(
        model,
        target.row,
        target.structureId,
        coordinates,
      ),
    })
  }

  const result = superposeOnColumns(
    referenceRow,
    others.map(o => o.coordinates),
    column =>
      columns === undefined ||
      (column >= columns.start && column <= columns.end),
  )
  const fits = result.fits.map(fit => ({
    ...fit,
    structureId: others.find(o => o.coordinates.row === fit.row)!.structureId,
  }))
  const matrices: Record<string, Mat4> = {}
  for (const fit of fits) {
    matrices[fit.structureId] = fit.matrix
  }

  // the column of each residue of the reference row, in order
  const referenceColumns: number[] = []
  const sequence = model.rowSequence(reference.row) ?? ''
  for (let column = 0; column < sequence.length; column++) {
    if (sequence[column] !== '-' && sequence[column] !== '.') {
      referenceColumns.push(column)
    }
  }
  return {
    referenceId: reference.structureId,
    matrices,
    fits,
    distanceValues: meanColumnDistances(fits, referenceColumns),
    skipped: [...skipped, ...result.skipped],
  }
}
