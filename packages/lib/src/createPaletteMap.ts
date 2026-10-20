import { colord, extend } from 'colord'
import lchPlugin from 'colord/plugins/lch'

import palettes from './ggplotPalettes.ts'

extend([lchPlugin])

/**
 * Creates a map from keys to colors. `palette` names the colors to take in
 * order, such as the list a scale asked for by name; without it the keys take
 * the ggplot palette of their own size. Beyond the colors available — a
 * gene-structure overlay with one feature per exon, or nine keys on an
 * eight-color palette — every key gets an evenly spaced hue instead, so no
 * two keys share a color. The hues sit at CIELAB `lightness` where one is
 * given, else at HSL lightness 60.
 */
export function createPaletteMap(
  keys: string[],
  palette?: readonly string[],
  lightness?: number,
) {
  const n = keys.length
  const colors = palette ?? palettes[n - 1]
  if (colors && n <= colors.length) {
    return Object.fromEntries(keys.map((key, i) => [key, colors[i]!]))
  }
  return Object.fromEntries(
    keys.map((key, i) => {
      const h = (i * 360) / n
      return [
        key,
        (lightness === undefined
          ? colord({ h, s: 60, l: 60 })
          : colord({ l: lightness, c: 40, h })
        ).toHex(),
      ]
    }),
  )
}
