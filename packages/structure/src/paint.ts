import { componentsOfStructure, residueLoci } from './molstar.ts'

import type { Molstar, PolymerResidue } from './molstar.ts'
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context'
import type { MsaViewModel } from 'react-msaview'

export type StructureColor = 'none' | 'conservation' | 'scheme'

export const conservationRamp = [
  '#86b6ef',
  '#5598e7',
  '#2a78d6',
  '#1c5cab',
  '#104281',
]
export const noColumnColor = '#c9c9c4'

export type ChainResidues = [chain: string, labelSeqIds: number[]][]
export type PaintGroup = [color: string, chains: ChainResidues]

/**
 * The row residue a structure residue maps to, reading the mapping's own
 * `asymIdKind`: a mapping that says `label` or `auth` is compared on that id
 * alone, and one that says nothing on the label id and then the author id.
 */
export function rowResidueOfChain(
  model: MsaViewModel,
  structureId: string,
  labelSeqId: number,
  labelAsymId: string,
  authAsymId: string,
) {
  const kinds = new Set(
    model.mappedStructures
      .filter(m => m.structure.id === structureId)
      .map(m => m.structure.asymIdKind),
  )
  const byLabel = kinds.has('label') || kinds.has(undefined)
  const byAuth = kinds.has('auth') || kinds.has(undefined)
  return (
    (byLabel
      ? model.rowResidue(structureId, labelSeqId, labelAsymId)
      : undefined) ??
    (byAuth ? model.rowResidue(structureId, labelSeqId, authAsymId) : undefined)
  )
}

export function conservationColor(
  model: MsaViewModel,
  rowName: string,
  seqPos: number,
) {
  const col = model.seqPosToVisibleCol(rowName, seqPos - 1)
  const value = col === undefined ? undefined : model.conservation[col]
  return value === undefined
    ? undefined
    : conservationRamp[
        Math.min(
          conservationRamp.length - 1,
          Math.floor(value * conservationRamp.length),
        )
      ]
}

/**
 * Groups a structure's polymer residues by the color the alignment gives the
 * row residue each maps to, one group per color so a scheme of many shades
 * costs one overpaint call each. A residue no row maps to, or one the scheme
 * leaves uncolored, takes the grey. Groups are sorted so two equal paints
 * compare equal.
 */
export function paintGroups(
  model: MsaViewModel,
  structureId: string,
  residues: PolymerResidue[],
  colorOf: (rowName: string, seqPos: number) => string | undefined,
): PaintGroup[] {
  const groups = new Map<string, Map<string, number[]>>()
  for (const { labelAsymId, authAsymId, labelSeqId } of residues) {
    const hit = rowResidueOfChain(
      model,
      structureId,
      labelSeqId,
      labelAsymId,
      authAsymId,
    )
    const color = (hit && colorOf(hit.rowName, hit.seqPos)) ?? noColumnColor
    const chains = groups.get(color) ?? new Map<string, number[]>()
    const ids = chains.get(labelAsymId) ?? []
    ids.push(labelSeqId)
    chains.set(labelAsymId, ids)
    groups.set(color, chains)
  }
  return [...groups]
    .map(([color, chains]): PaintGroup => [color, [...chains]])
    .sort(([a], [b]) => a.localeCompare(b))
}

const highlightDefault = '#ff8c00'

/** a CSS color as the opaque hex Mol* paints with; alpha is dropped */
export function solidHex(css: string | undefined) {
  if (!css) {
    return highlightDefault
  }
  const hex = /^#([0-9a-f]{6})\b/i.exec(css.trim())
  if (hex) {
    return `#${hex[1]!.toLowerCase()}`
  }
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(css.trim())
  if (short) {
    return `#${short[1]!}${short[1]!}${short[2]!}${short[2]!}${short[3]!}${short[3]!}`.toLowerCase()
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(css.trim())
  if (rgb) {
    return `#${[rgb[1], rgb[2], rgb[3]]
      .map(v => Math.min(255, Number(v)).toString(16).padStart(2, '0'))
      .join('')}`
  }
  return highlightDefault
}

/**
 * The residues of a structure the alignment's `highlights` layer marks, one
 * group per highlight color, to overpaint on top of the base paint. A highlight
 * names residues of a row (`row`, `start`, `end`), file columns (`start`, `end`
 * alone) or whole rows (`rows`), and each reaches the structure through the
 * row residue its residues map to, so a row that maps onto this structure is
 * the only way in. A later highlight wins where two overlap.
 */
export function highlightGroups(
  model: MsaViewModel,
  structureId: string,
  residues: PolymerResidue[],
): PaintGroup[] {
  const marks = model.highlights
  if (marks.length === 0) {
    return []
  }
  const byColor = new Map<string, Map<string, Set<number>>>()
  for (const { labelAsymId, authAsymId, labelSeqId } of residues) {
    const hit = rowResidueOfChain(
      model,
      structureId,
      labelSeqId,
      labelAsymId,
      authAsymId,
    )
    if (!hit) {
      continue
    }
    let color: string | undefined
    for (const mark of marks) {
      const { row, rows, start, end } = mark
      const inRow =
        rows !== undefined && start === undefined
          ? rows.includes(hit.rowName)
          : start !== undefined &&
            end !== undefined &&
            (row === undefined
              ? (() => {
                  const column = model.seqPosToGlobalCol(
                    hit.rowName,
                    hit.seqPos - 1,
                  )
                  return (
                    column !== undefined &&
                    column + 1 >= start &&
                    column + 1 <= end
                  )
                })()
              : row === hit.rowName && hit.seqPos >= start && hit.seqPos <= end)
      if (inRow) {
        color = solidHex(mark.color)
      }
    }
    if (color !== undefined) {
      const chains = byColor.get(color) ?? new Map<string, Set<number>>()
      const ids = chains.get(labelAsymId) ?? new Set<number>()
      ids.add(labelSeqId)
      chains.set(labelAsymId, ids)
      byColor.set(color, chains)
    }
  }
  return [...byColor]
    .map(([color, chains]): PaintGroup => [
      color,
      [...chains].map(([chain, ids]) => [chain, [...ids]]),
    ])
    .sort(([a], [b]) => a.localeCompare(b))
}

const unmappedColor = '#d9d9d4'

/**
 * The structure in one color where the alignment covers it, and pale where it
 * does not, so a disordered tail or an unaligned domain recedes behind the part
 * the alignment compares. `color` goes to the residues a row maps onto.
 */
export function solidMappedGroups(
  model: MsaViewModel,
  structureId: string,
  residues: PolymerResidue[],
  color: string,
): PaintGroup[] {
  return paintGroups(model, structureId, residues, () => color).map(
    ([group, chains]): PaintGroup => [
      group === noColumnColor ? unmappedColor : group,
      chains,
    ],
  )
}

/** the polymer residues a row maps onto, to frame a view on */
export function mappedResidues(
  model: MsaViewModel,
  structureId: string,
  residues: PolymerResidue[],
) {
  return residues.filter(
    ({ labelAsymId, authAsymId, labelSeqId }) =>
      rowResidueOfChain(
        model,
        structureId,
        labelSeqId,
        labelAsymId,
        authAsymId,
      ) !== undefined,
  )
}

/** every residue of the structure in one color, to tell structures apart */
export function solidGroups(
  residues: PolymerResidue[],
  color: string,
): PaintGroup[] {
  const chains = new Map<string, number[]>()
  for (const { labelAsymId, labelSeqId } of residues) {
    const ids = chains.get(labelAsymId) ?? []
    ids.push(labelSeqId)
    chains.set(labelAsymId, ids)
  }
  return [[color, [...chains]]]
}

/**
 * Overpaints one loaded structure, found by its root state ref, clearing its
 * earlier paint first.
 */
export async function paintStructure(
  plugin: PluginUIContext,
  molstar: Molstar,
  groups: PaintGroup[],
  ref: string,
) {
  const components = await componentsOfStructure(plugin, ref)
  await molstar.clearStructureOverpaint(plugin, components)
  for (const [color, chains] of groups) {
    await molstar.setStructureOverpaint(
      plugin,
      components,
      molstar.Color.fromHexStyle(color),
      structure =>
        Promise.resolve(
          chains
            .map(([chain, ids]) => residueLoci(molstar, structure, ids, chain))
            .reduce((a, b) => molstar.StructureElement.Loci.union(a, b)),
        ),
    )
  }
}
