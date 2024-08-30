import type { HierarchyNode } from 'd3-hierarchy'
import { max } from 'd3-array'
import type { Theme } from '@mui/material'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'

extend([namesPlugin])

export function transform<T>(
  obj: Record<string, T>,
  cb: (arg0: [string, T]) => [string, T],
) {
  return Object.fromEntries(Object.entries(obj).map(cb))
}

interface Node {
  children?: Node[]
  name?: string
  [key: string]: unknown
}

export interface NodeWithIds {
  id: string
  name: string
  children: NodeWithIds[]
  length?: number
  noTree?: boolean
}

export interface NodeWithIdsAndLength {
  id: string
  name: string
  children: NodeWithIdsAndLength[]
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
    children:
      tree.children?.map((b, i) =>
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

// basically same as setRadius from https://observablehq.com/@d3/tree-of-life
export function setBrLength(
  d: HierarchyNode<NodeWithIds>,
  y0: number,
  k: number,
) {
  // @ts-expect-error
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k

  if (d.children) {
    d.children.forEach(d => {
      setBrLength(d, y0, k)
    })
  }
}

// basically same as maxLength from https://observablehq.com/@d3/tree-of-life
export function maxLength(d: HierarchyNode<NodeWithIds>): number {
  return (
    (d.data.length || 0) + (d.children ? max(d.children, maxLength) || 0 : 0)
  )
}

// Collapse the node and all it's children, from
// https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
export function collapse(d: HierarchyNode<NodeWithIds>) {
  if (d.children) {
    // @ts-expect-error
    d._children = d.children
    // @ts-expect-error
    d.children = null
  }
}

export function clamp(min: number, num: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

export function len(a: { end: number; start: number }) {
  return a.end - a.start
}
