import Color from 'color'
import { HierarchyNode } from 'd3-hierarchy'
import { max } from 'd3-array'
import { Theme } from '@mui/material'
export function transform<T>(
  obj: Record<string, T>,
  cb: (arg0: [string, T]) => [string, T],
) {
  return Object.fromEntries(Object.entries(obj).map(cb))
}

export type Node = { branchset?: Node[] }
export type NodeWithIds = {
  id: string
  branchset: NodeWithIds[]
  noTree?: boolean
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
    branchset:
      tree.branchset?.map((b, i) =>
        generateNodeIds(b, `${id}-${i}`, depth + 1),
      ) || [],
  }
}

export function colorContrast(
  colorScheme: { [key: string]: string },
  theme: Theme,
) {
  return transform(colorScheme, ([letter, color]) => [
    letter,
    theme.palette.getContrastText(Color(color).hex()),
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

export function skipBlanks(blanks: number[], arg: string) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setBrLength(d: HierarchyNode<any>, y0: number, k: number) {
  // @ts-expect-error
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k
  d.children?.forEach(d => {
    setBrLength(d, y0, k)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function maxLength(d: HierarchyNode<any>): number {
  return (d.data.length || 1) + (d.children ? max(d.children, maxLength) : 0)
}

// Collapse the node and all it's children, from
// https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collapse(d: HierarchyNode<any>) {
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
