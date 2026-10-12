import { labelFitFontSize } from '../../constants.ts'
import { measureTextCanvas } from '../../measureTextCanvas.ts'

import type { Clade, ResolvedClade } from '../../types.ts'

// The bar of the bracket mark and the space around it, in px.
export const bracketBarWidth = 3
export const bracketGap = 4

// The widest gutter the bracket mark takes. A longer label is clipped, so one
// long name cannot squeeze the tree it annotates.
export const maxCladeGutterWidth = 140

/** whether a clade draws in the gutter: a bracket, or a highlight with a label */
export function cladeInGutter(clade: Pick<Clade, 'mark' | 'label'>) {
  return (
    clade.mark === 'bracket' || (clade.mark === 'highlight' && !!clade.label)
  )
}

/** the pixel height of the rows a clade covers */
export function cladeHeight(clade: ResolvedClade, rowHeight: number) {
  return (clade.rows[1] - clade.rows[0] + 1) * rowHeight
}

/**
 * Whether a label reads across the rows. It does where they are taller than the
 * font, and runs up the bar where they are not.
 */
export function cladeLabelHorizontal(
  clade: ResolvedClade,
  rowHeight: number,
  fontSize: number,
) {
  return cladeHeight(clade, rowHeight) >= fontSize
}

/** the px between the left edge of the gutter and the label's own column */
export function cladeLabelOffset(clade: Pick<Clade, 'mark'>) {
  return clade.mark === 'bracket'
    ? bracketGap + bracketBarWidth + bracketGap
    : bracketGap
}

/**
 * The gutter the bracket mark needs at the right of the tree area: the bar plus
 * the widest label read across at labelFitFontSize, zero where no clade draws
 * there, and at most maxCladeGutterWidth. The records size it, so a zoom, a
 * collapse or a focus leaves it as it is, and a renderer clips a label that
 * outgrows it.
 */
export function cladeGutterWidth(clades: Pick<Clade, 'mark' | 'label'>[]) {
  let widest = 0
  for (const clade of clades) {
    if (!cladeInGutter(clade)) {
      continue
    }
    const text = clade.label
      ? measureTextCanvas(clade.label, labelFitFontSize)
      : 0
    widest = Math.max(widest, cladeLabelOffset(clade) + text + bracketGap)
  }
  // a whole pixel, so the room the renderers measure against covers the label
  // the measurement here sized the gutter for
  return Math.min(maxCladeGutterWidth, Math.ceil(widest))
}
