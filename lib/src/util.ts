import { HierarchyNode } from 'd3-hierarchy'
import { max } from 'd3-array'
import { Theme } from '@mui/material'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'
import { FileLocation } from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'

extend([namesPlugin])

export function transform<T>(
  obj: Record<string, T>,
  cb: (arg0: [string, T]) => [string, T],
) {
  return Object.fromEntries(Object.entries(obj).map(cb))
}

interface Node {
  branchset?: Node[]
  name?: string
  [key: string]: unknown
}

export interface NodeWithIds {
  id: string
  name: string
  branchset: NodeWithIds[]
  length?: number
  noTree?: boolean
}

export interface NodeWithIdsAndLength {
  id: string
  name: string
  branchset: NodeWithIdsAndLength[]
  noTree?: boolean
  length: number
}

export function generateNodeIds(
  tree: Node,
  parent = 'node',
  depth = 0,
): NodeWithIds {
  const id = `${parent}-${depth}`

  return {
    ...tree,
    id,
    name: tree.name || id,
    branchset:
      tree.branchset?.map((b, i) =>
        generateNodeIds(b, `${id}-${i}`, depth + 1),
      ) || [],
  }
}

export function colorContrast(
  colorScheme: Record<string, string>,
  theme: Theme,
) {
  return transform(colorScheme, ([letter, color]) => [
    letter,
    theme.palette.getContrastText(colord(color).toHex()),
  ])
}

export function parseGFF(str?: string) {
  return str
    ?.split('\n')
    .map(f => f.trim())
    .filter(f => !!f && !f.startsWith('#'))
    .map(f => {
      const [seq_id, source, type, start, end, score, strand, phase, col9] =
        f.split('\t')

      return {
        seq_id,
        source,
        type,
        start: +start,
        end: +end,
        score: +score,
        strand,
        phase,
        ...Object.fromEntries(
          col9
            .split(';')
            .map(f => f.trim())
            .filter(f => !!f)
            .map(f => f.split('='))
            .map(([key, val]) => [
              key.trim(),
              decodeURIComponent(val).trim().split(',').join(' '),
            ]),
        ),
      }
    })
}

export function skipBlanks(blanks: number[], arg: string | string[]) {
  let s = ''
  let b = 0
  for (let j = 0; j < arg.length; j++) {
    if (j === blanks[b]) {
      b++
    } else {
      s += arg[j]
    }
  }
  return s
}

export function setBrLength(
  d: HierarchyNode<NodeWithIds>,
  y0: number,
  k: number,
) {
  // @ts-expect-error
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k
  d.children?.forEach(d => {
    setBrLength(d, y0, k)
  })
}

export function maxLength(d: HierarchyNode<NodeWithIds>): number {
  return (
    (d.data.length || 1) + (d.children ? max(d.children, maxLength) || 0 : 0)
  )
}

// Collapse the node and all it's children, from
// https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
export function collapse(d: HierarchyNode<NodeWithIds>) {
  if (d.children) {
    // @ts-expect-error
    d._children = d.children
    // @ts-expect-error
    d._children.forEach(collapse)
    // @ts-expect-error
    d.children = null
  }
}

export function clamp(min: number, num: number, max: number) {
  return Math.min(Math.max(num, min), max)
}
