import type { MsaViewModel } from 'react-msaview'

export interface Facet {
  label: string
  rows: string[]
  /** the mapped structures of those rows, one per row, in row order */
  structureIds: string[]
  color: string
}

// the same cool colors a structure panel uses, so a highlight keeps its warm
// color against any of them
const FACET_COLORS = [
  '#0072b2',
  '#009e73',
  '#7a5195',
  '#6c757d',
  '#56b4e9',
  '#4d9078',
  '#8c6bb1',
  '#999999',
]

/**
 * Splits rows into groups, each with the structures its rows map onto. A row
 * with no mapped structure is left out of its group, and a group left with no
 * structure is dropped, so every facet has something to draw.
 *
 * `groups` maps a label to row names, in the order the facets lay out.
 */
export function facetsOfGroups(
  model: MsaViewModel,
  groups: Record<string, string[]>,
  colors: Record<string, string> = {},
): Facet[] {
  const idOfRow = new Map<string, string>()
  for (const { row, structure } of model.mappedStructures) {
    if (!idOfRow.has(row)) {
      idOfRow.set(row, structure.id)
    }
  }
  return Object.entries(groups).flatMap(([label, names], index) => {
    const rows = names.filter(name => idOfRow.has(name))
    const structureIds = [...new Set(rows.map(name => idOfRow.get(name)!))]
    return structureIds.length === 0
      ? []
      : [
          {
            label,
            rows,
            structureIds,
            color: colors[label] ?? FACET_COLORS[index % FACET_COLORS.length]!,
          },
        ]
  })
}

/**
 * Facets by a field of the row table (`rowData`), such as a family or a clade
 * name written there: one facet per distinct value, in order of first
 * appearance among the alignment's rows.
 */
export function facetsByRowField(
  model: MsaViewModel,
  field: string,
  colors: Record<string, string> = {},
): Facet[] {
  const groups: Record<string, string[]> = {}
  for (const name of model.rowMap.keys()) {
    const value = model.rowDataOf(name)?.[field]
    if (value !== undefined && value !== '') {
      ;(groups[value] ??= []).push(name)
    }
  }
  return facetsOfGroups(model, groups, colors)
}
