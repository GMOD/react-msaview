// @vitest-environment jsdom
import { autorun } from 'mobx'
import { expect, test } from 'vitest'

import MSAModelF from './model.ts'

// jsdom has no 2d context, so measureTextCanvas falls back to an estimate. Only
// the width matters here, so a stub keeps the test about tree size, and counts
// the labels it measures.
let measured = 0
HTMLCanvasElement.prototype.getContext = (() => ({
  font: '12px sans-serif',
  measureText: (t: string) => {
    measured++
    return { width: t.length * 7 }
  },
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

// The import form ships a "230k COVID-19 samples (tree only)" example, so a tree
// this size is a supported input, and anything that reduces over its rows has
// to do it without passing one argument per row.
function flatNewick(n: number) {
  return `(${Array.from({ length: n }, (_, i) => `s${i}:0.1`).join(',')});`
}

test('a tree far past the argument limit still lays out', () => {
  const model = MSAModelF().create({
    type: 'MsaView',
    data: { tree: flatNewick(200_000) },
  })
  model.setWidth(1000)

  expect(model.numRows).toBe(200_000)
  // 's199999' is among the longest names, at 7 chars * 7px
  expect(model.maxTipLabelWidth).toBe(49)
  expect(model.effectiveTreeWidth).toBeGreaterThan(0)
})

test('re-hovering the same tree node does not re-walk the tree', () => {
  const model = MSAModelF().create({
    type: 'MsaView',
    data: { tree: flatNewick(200_000) },
  })
  model.setWidth(1000)

  const leafId = model.leaves[1000]!.data.id
  model.setHoveredTreeNode(leafId)
  const first = model.hoveredTreeNode

  // the tree's mousemove handler fires this on every event, so an unchanged id
  // has to leave the state object alone: rebuilding it walks all 200k nodes and
  // invalidates every overlay that reads hoveredRowIndices
  model.setHoveredTreeNode(leafId)
  expect(model.hoveredTreeNode).toBe(first)

  model.setHoveredTreeNode(undefined)
  expect(model.hoveredTreeNode).toBeUndefined()
})

test('the fit measures a few of the longest labels, and a zoom none', () => {
  const model = MSAModelF().create({
    type: 'MsaView',
    data: { tree: flatNewick(200_000) },
  })
  model.setWidth(1000)

  measured = 0
  const dispose = autorun(() => {
    void model.effectiveTreeAreaWidth
  })
  const first = measured
  expect(first).toBeGreaterThan(0)
  expect(first).toBeLessThanOrEqual(100)
  model.setRowHeight(24)
  model.setRowHeight(4)
  expect(measured).toBe(first)
  dispose()
})
