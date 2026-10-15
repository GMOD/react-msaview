import { colord } from 'colord'

import { tileColorFn } from './components/msa/tileColor.ts'

import type { MsaViewModel } from './model.ts'

/**
 * A reader for the color the active scheme gives a row's residue, as hex, for a
 * host that paints another view, such as a structure, with the alignment's own
 * colors. `seqPos` is 1-based, like `structureResidue`. The reader returns
 * undefined where the scheme leaves the residue uncolored, the row lacks it, or
 * its column is hidden.
 *
 * Build it inside a reaction: a new scheme, a hidden gap column or a collapsed
 * clade then re-runs the caller.
 */
export function schemeResidueColor(model: MsaViewModel) {
  const colorAt = tileColorFn(model)
  const { columns } = model
  const hexes = new Map<string, string | undefined>()
  const toHex = (color: string) => {
    if (!hexes.has(color)) {
      const parsed = colord(color)
      hexes.set(color, parsed.isValid() ? parsed.toHex() : undefined)
    }
    return hexes.get(color)
  }
  return (rowName: string, seqPos: number) => {
    const col = model.seqPosToVisibleCol(rowName, seqPos - 1)
    const letter = col === undefined ? undefined : columns.get(rowName)?.[col]
    const color =
      col === undefined || letter === undefined
        ? undefined
        : colorAt(col, letter)
    return color === undefined ? undefined : toHex(color)
  }
}
