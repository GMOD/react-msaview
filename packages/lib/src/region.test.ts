import { getSnapshot } from '@jbrowse/mobx-state-tree'
import { expect, test } from 'vitest'

import stateModelFactory from './model.ts'

const msa = `>Human\n${'MEEPQSDPSV'.repeat(20)}\n>Mouse\n${'MEE-QSDPSV'.repeat(20)}`

test('a region waits for the view to have a width, zooms, and is dropped', () => {
  const region = { row: 'Human', start: 150, end: 160 }
  const model = stateModelFactory().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa },
    region,
  })
  expect(model.region).toEqual(region)

  model.setWidth(800)
  expect(model.region).toBeUndefined()
  expect(model.scrollX).toBeLessThan(0)
  expect(JSON.stringify(getSnapshot(model))).not.toContain('region')
})

test('a region waits for a tree file to load', () => {
  const model = stateModelFactory().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa },
    treeFilehandle: { uri: 'https://example.com/never.nh' },
    region: { start: 10, end: 20 },
  })
  model.setWidth(800)
  expect(model.region).toEqual({ start: 10, end: 20 })
})

const manyRows = Array.from(
  { length: 60 },
  (_, i) => `>row${i}\n${'MEEPQSDPSV'.repeat(20)}`,
).join('\n')

test('a region naming a row scrolls that row to the middle', () => {
  const model = stateModelFactory().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa: manyRows },
    region: { row: 'row50', start: 150, end: 160 },
  })
  model.setWidth(800)
  const rowTop = 50 * model.rowHeight + model.scrollY
  expect(model.scrollY).toBeLessThan(0)
  expect(rowTop).toBeGreaterThan(0)
  expect(rowTop + model.rowHeight).toBeLessThan(model.msaAreaHeight)
})

test('a region of columns alone leaves the vertical scroll at the top', () => {
  const model = stateModelFactory().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa: manyRows },
    region: { start: 150, end: 160 },
  })
  model.setWidth(800)
  expect(model.scrollX).toBeLessThan(0)
  expect(model.scrollY).toBe(0)
})
