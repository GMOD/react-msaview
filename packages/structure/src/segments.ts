import { alignSequences } from 'p2s_mapper'

import type { ResidueSegment } from 'react-msaview'

/** one residue of a row and the structure residue it sits on, both 1-based */
export type ResiduePair = [row: number, structure: number]

/**
 * The residue pairs of a pairwise alignment, both numbered from 1 in the
 * ungapped sequences. Mismatched residues pair too: a substitution is still the
 * same position of the protein.
 */
export function pairsOfAlignment(alignedRow: string, alignedOther: string) {
  const pairs: ResiduePair[] = []
  let row = 0
  let other = 0
  for (let i = 0; i < alignedRow.length; i++) {
    const inRow = alignedRow[i] !== '-'
    const inOther = alignedOther[i] !== '-'
    row += inRow ? 1 : 0
    other += inOther ? 1 : 0
    if (inRow && inOther) {
      pairs.push([row, other])
    }
  }
  return pairs
}

/**
 * Pairs folded into the segments a `residueMappings` record holds: each run of
 * consecutive row residues on consecutive structure residues is one segment.
 * `pairs` ascend by row residue.
 */
export function segmentsOfPairs(pairs: ResiduePair[]): ResidueSegment[] {
  const segments: ResidueSegment[] = []
  for (const [row, structure] of pairs) {
    const last = segments.at(-1)
    if (last && row === last.rowEnd + 1 && structure === last.structEnd + 1) {
      last.rowEnd = row
      last.structEnd = structure
    } else {
      segments.push({
        rowStart: row,
        rowEnd: row,
        structStart: structure,
        structEnd: structure,
      })
    }
  }
  return segments
}

/**
 * Aligns an ungapped row to a reference sequence, such as the UniProt entry,
 * and returns the residue pairs. Smith-Waterman, so a row that carries a tag or
 * covers a domain of the reference maps only where the two agree.
 */
export function alignToReference(rowSequence: string, reference: string) {
  const alignment = alignSequences(rowSequence, reference, 'smith_waterman')
  return {
    alignment,
    pairs: pairsOfAlignment(alignment.alns[0].seq, alignment.alns[1].seq),
  }
}

/**
 * Sends each pair's second residue through `via`, dropping the pairs it has no
 * answer for. Composes row-to-UniProt with UniProt-to-structure.
 */
export function composePairs(
  pairs: ResiduePair[],
  via: (residue: number) => number | undefined,
): ResiduePair[] {
  return pairs.flatMap(([row, residue]) => {
    const mapped = via(residue)
    return mapped === undefined ? [] : [[row, mapped] as ResiduePair]
  })
}
