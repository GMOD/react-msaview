import { residueLoci } from './molstar.ts'

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
    const hit =
      model.rowResidue(structureId, labelSeqId, labelAsymId) ??
      model.rowResidue(structureId, labelSeqId, authAsymId)
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
  const components =
    plugin.managers.structure.hierarchy.current.structures.find(
      s => s.cell.transform.ref === ref,
    )?.components ?? []
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
