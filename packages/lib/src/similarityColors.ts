// Similarity shading, after biotite's plot_alignment_similarity_based and
// Jalview's BLOSUM62 score scheme. Each residue takes a shade of one hue by how
// similar it is, on average, to the other residues of its column.

import { BLOSUM62, NUM_SYMBOLS, symbolOfCode } from './blosum62.ts'
import { letterOfResidueSlot, numResidueSlots } from './columnCounts.ts'

import type { ColumnCounts } from './columnCounts.ts'

const AMINO_ACIDS = 20
const HUE = 240
const SATURATION = 50
const LIGHTEST = 96
const DARKEST = 40

// BLOSUM62 scaled per row to 0..1 over the twenty amino acids, so a residue's
// own score is 1 and its worst substitution 0. Not symmetric, like biotite's.
const normalized = new Float32Array(NUM_SYMBOLS * NUM_SYMBOLS)
for (let a = 0; a < NUM_SYMBOLS; a++) {
  let min = Infinity
  let max = -Infinity
  for (let b = 0; b < AMINO_ACIDS; b++) {
    const score = BLOSUM62[a * NUM_SYMBOLS + b]!
    min = Math.min(min, score)
    max = Math.max(max, score)
  }
  for (let b = 0; b < NUM_SYMBOLS; b++) {
    const scaled = (BLOSUM62[a * NUM_SYMBOLS + b]! - min) / (max - min)
    normalized[a * NUM_SYMBOLS + b] = Math.min(Math.max(scaled, 0), 1)
  }
}

// residue slot -> row of the matrix, -1 for a letter the matrix does not name
const symbolOfSlot = Int8Array.from({ length: numResidueSlots }, (_, slot) => {
  const letter = letterOfResidueSlot(slot)
  return letter.length === 1 ? symbolOfCode[letter.charCodeAt(0)]! : -1
})

function shade(similarity: number) {
  const lightness = Math.round(LIGHTEST - (LIGHTEST - DARKEST) * similarity)
  return `hsl(${HUE}, ${SATURATION}%, ${lightness}%)`
}

interface Measure {
  /** whether a residue counts toward the means at all */
  counted: (slot: number) => boolean
  /** whether a residue takes a shade, given it is counted */
  shaded: (slot: number) => boolean
  /** similarity of residue `a` to residue `b`, 0..1 */
  score: (a: number, b: number) => number
}

/**
 * Shades each residue of one column by its mean similarity to the column's
 * other residues, gaps left out of the mean. A column of fewer than two counted
 * residues has nothing to compare and colors nothing.
 */
function shadeColumn(counts: ColumnCounts, col: number, measure: Measure) {
  const { counted, shaded, score } = measure
  const present: [slot: number, count: number][] = []
  let total = 0
  counts.forEachResidue(col, (slot, count) => {
    if (counted(slot)) {
      present.push([slot, count])
      total += count
    }
  })

  const colors: Record<string, string> = {}
  if (total < 2) {
    return colors
  }
  for (const [a] of present) {
    if (shaded(a)) {
      let sum = -score(a, a)
      for (const [b, count] of present) {
        sum += count * score(a, b)
      }
      colors[letterOfResidueSlot(a)] = shade(sum / (total - 1))
    }
  }
  return colors
}

const blosum62: Measure = {
  counted: slot => symbolOfSlot[slot]! >= 0,
  shaded: slot => symbolOfSlot[slot]! < AMINO_ACIDS,
  score: (a, b) =>
    normalized[symbolOfSlot[a]! * NUM_SYMBOLS + symbolOfSlot[b]!]!,
}

const identity: Measure = {
  counted: () => true,
  shaded: () => true,
  score: (a, b) => (a === b ? 1 : 0),
}

/**
 * The amino acids of a column shaded by BLOSUM62 similarity. Letters the matrix
 * does not name, such as U, O and J, count for nothing and take no shade.
 */
export function blosum62ColumnColors(counts: ColumnCounts, col: number) {
  return shadeColumn(counts, col, blosum62)
}

/**
 * Nucleotides and anything else without a substitution matrix: a residue's
 * similarity is the fraction of the rest of its column that equals it.
 */
export function identityColumnColors(counts: ColumnCounts, col: number) {
  return shadeColumn(counts, col, identity)
}
