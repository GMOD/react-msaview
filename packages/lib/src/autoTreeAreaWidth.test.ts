// @vitest-environment jsdom
import { getSnapshot } from '@jbrowse/mobx-state-tree'
import { expect, test } from 'vitest'

import MSAModelF from './model.ts'

const names = ['Caenorhabditis_elegans_query', 'b', 'c', 'd']
const msa = names.map(n => `>${n}\nMKAANSE`).join('\n')
const tree = `((${names[0]}:1,b:2):5,(c:1,d:3):1);`

function makeModel(snapshot: Record<string, unknown> = {}) {
  const model = MSAModelF().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa, tree },
    ...snapshot,
  })
  model.setWidth(1200)
  return model
}

test('the tree area fits the widest label beside the tree', () => {
  const model = makeModel()
  expect(model.autoTreeAreaWidth).toBe(true)
  expect(model.treeWidth).toBeGreaterThanOrEqual(80)
  expect(model.treeWidth + model.labelsWidth).toBeLessThan(
    model.treeAreaWidthMinusMargin,
  )
})

test('a tree area width in the snapshot wins over the fit', () => {
  const model = makeModel({ treeAreaWidth: 200, treeWidth: 100 })
  expect(model.autoTreeAreaWidth).toBe(false)
  expect(model.treeAreaWidth).toBe(200)
})

test('the fit holds to a share of the view', () => {
  const model = makeModel()
  model.setWidth(300)
  expect(model.treeAreaWidth).toBe(120)
})

test('a vertical zoom leaves the tree area where it is', () => {
  const model = makeModel()
  const before = model.treeAreaWidth
  model.setRowHeight(10)
  expect(model.treeAreaWidth).toBe(before)
  model.setRowHeight(30)
  expect(model.treeAreaWidth).toBe(before)
})

test('setting the width turns the fit off, and the snapshot keeps it', () => {
  const model = makeModel()
  expect(getSnapshot(model).treeAreaWidth).toBeUndefined()
  model.setTreeAreaWidth(250)
  expect(model.autoTreeAreaWidth).toBe(false)
  expect(model.treeAreaWidth).toBe(250)
  const snap = getSnapshot(model)
  expect(snap.treeAreaWidth).toBe(250)
  expect(makeModel(snap).treeAreaWidth).toBe(250)
})
