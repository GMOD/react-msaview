import './polyfills.ts'

import { colord } from 'colord'

import { tileColorFn } from '../../lib/src/components/msa/tileColor.ts'
import { layoutTree } from '../../lib/src/hierarchy.ts'
import MSAModelF from '../../lib/src/model.ts'
import { viewerSnapshot } from '../../lib/src/viewerSnapshot.ts'

import type { MSAViewerProps } from '../../lib/src/components/MSAViewer.tsx'
import type { LaidOutNode } from '../../lib/src/hierarchy.ts'
import type { NodeWithIds } from '../../lib/src/types.ts'

type Table = Record<string, unknown[]>

function table(...names: string[]): Table {
  return Object.fromEntries(names.map(name => [name, []]))
}

function push(t: Table, row: Record<string, unknown>) {
  for (const key in t) {
    t[key]!.push(row[key] ?? null)
  }
}

// R reads hex, with alpha, but not rgb() or hsl()
function hex(color: string | undefined) {
  return color === undefined ? undefined : colord(color).toHex()
}

function luminance(color: string) {
  const { r, g, b } = colord(color).toRgb()
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// MUI's getContrastText at its default threshold of 3, as the viewer's
// letters take it
function contrastText(fill: string) {
  return 1.05 / (luminance(fill) + 0.05) >= 3 ? '#ffffff' : '#000000de'
}

function treeTables(model: ReturnType<ReturnType<typeof MSAModelF>['create']>) {
  const segments = table('x', 'y', 'xend', 'yend')
  const collapsed = table('x', 'y', 'group')
  if (model.tree.noTree) {
    return undefined
  }
  const { root, rootToTipLength } = layoutTree(model.root, {
    rowHeight: 1,
    treeWidth: 1,
  })
  const byLength = model.showBranchLen && rootToTipLength > 0
  const xOf = (node: LaidOutNode<NodeWithIds>) =>
    byLength ? node.branchLength : node.depthFraction
  // layoutTree puts the first tip at 0.5; the tables number rows from 1
  const yOf = (node: LaidOutNode<NodeWithIds>) => node.row + 0.5
  const stack = [root]
  let group = 0
  while (stack.length > 0) {
    const node = stack.pop()!
    const x = xOf(node)
    if (node.children?.length) {
      push(segments, {
        x,
        y: yOf(node.children[0]!),
        xend: x,
        yend: yOf(node.children.at(-1)!),
      })
      for (const child of node.children) {
        const y = yOf(child)
        push(segments, { x, y, xend: xOf(child), yend: y })
        stack.push(child)
      }
    } else if (byLength && node.collapsedBranchLength !== undefined) {
      group++
      const y = yOf(node)
      for (const [px, py] of [
        [x, y],
        [node.collapsedBranchLength, y - 0.35],
        [node.collapsedBranchLength, y + 0.35],
      ]) {
        push(collapsed, { x: px, y: py, group })
      }
    }
  }
  return { segments, collapsed, byLength }
}

function figure(propsJson: string) {
  const props = JSON.parse(propsJson) as MSAViewerProps
  const model = MSAModelF().create(viewerSnapshot(props))
  model.setWidth(1000)
  const { leaves, columns, numColumns, relativeTo } = model
  const names = leaves.map(leaf => leaf.data.name)
  const rowOf = new Map(names.map((name, i) => [name, i + 1]))

  const colorAt = tileColorFn(model)
  const colors = table('col', 'letter', 'fill', 'text')
  const seen = new Set<string>()
  const dynamic = model.dynamicColorSchemeName !== undefined
  for (const seq of columns.values()) {
    for (let col = 0; col < seq.length; col++) {
      const letter = seq[col]!
      const key = dynamic ? `${col}:${letter}` : letter
      if (!seen.has(key)) {
        seen.add(key)
        const fill = hex(colorAt(col, letter))
        if (fill) {
          push(colors, {
            col: dynamic ? col + 1 : undefined,
            letter,
            fill,
            text: contrastText(fill),
          })
        }
      }
    }
  }

  const domains = table(
    'row',
    'start',
    'end',
    'label',
    'accession',
    'fill',
    'stroke',
  )
  for (const [name, bands] of model.domainBands) {
    const row = rowOf.get(name)
    if (row !== undefined) {
      for (const { annotation, startCol, endCol } of bands) {
        const color = model.featureColors.get(annotation)
        push(domains, {
          row,
          start: startCol + 1,
          end: endCol,
          label: annotation.name,
          accession: annotation.accession,
          fill: hex(color?.fill),
          stroke: hex(color?.stroke),
        })
      }
    }
  }

  const highlights = table('start', 'end', 'row', 'label', 'color')
  for (const h of model.resolvedHighlights) {
    const rows = h.rowIndices.length
      ? h.rowIndices.map(r => r + 1)
      : [undefined]
    for (const row of rows) {
      push(highlights, {
        start: h.startCol === undefined ? undefined : h.startCol + 1,
        end: h.endCol === undefined ? undefined : h.endCol + 1,
        row,
        label: h.label,
        color: hex(h.color),
      })
    }
  }

  const clades = table('first', 'last', 'mark', 'color', 'label')
  for (const c of model.resolvedClades) {
    push(clades, {
      first: c.rows[0] + 1,
      last: c.rows[1] + 1,
      mark: c.mark,
      color: hex(c.markColor ?? c.color),
      label: c.label,
    })
  }

  return JSON.stringify({
    numColumns,
    rows: {
      name: names,
      seq: names.map(name => columns.get(name) ?? ''),
    },
    colors,
    reference: relativeTo ?? null,
    fillCells: model.bgColor,
    tree: treeTables(model) ?? null,
    domains,
    highlights,
    clades,
    legends: model.legends.map(({ title, entries }) => ({
      title,
      label: entries.map(e => e.label),
      color: entries.map(e => hex(e.color)),
    })),
    conservation: model.conservation,
  })
}

;(globalThis as Record<string, unknown>).msaviewFigure = figure
