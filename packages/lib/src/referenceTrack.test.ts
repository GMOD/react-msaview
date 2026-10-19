// @vitest-environment jsdom
import { expect, test } from 'vitest'

import { expandSpec } from './expandSpec.ts'
import { createTestModel } from './svgTestUtil.ts'

const msa = `>seq1
ACDEFGHIKL
>seq2
--DEFG-IKL`

function trackIds(model: ReturnType<typeof createTestModel>) {
  return model.turnedOnTracks.map(t => t.model.id)
}

test('a reference row repeats as the last track above the alignment', () => {
  const model = createTestModel({ id: 'reference', data: { msa } }, 800)
  expect(trackIds(model)).not.toContain('reference-row')

  model.drawRelativeTo('seq2')
  const track = model.turnedOnTracks.at(-1)!.model
  expect(track).toMatchObject({
    id: 'reference-row',
    name: 'seq2',
    kind: 'reference',
    data: '--DEFG-IKL',
    height: model.rowHeight,
  })

  model.drawRelativeTo(undefined)
  expect(trackIds(model)).not.toContain('reference-row')
})

test('the reference track hides with the gap columns, and toggles off', () => {
  const model = createTestModel(
    { id: 'reference-gaps', data: { msa }, relativeTo: 'seq2' },
    800,
  )
  model.setHideGaps(true)
  model.setAllowedGappyness(50)
  expect(model.turnedOnTracks.at(-1)!.model.data).toBe('DEFGIKL')

  model.toggleTrack('reference-row')
  expect(trackIds(model)).not.toContain('reference-row')
})

test("the shorthand's query pins its row too", () => {
  const model = createTestModel(
    expandSpec({ id: 'reference-query', data: { msa }, query: 'seq2' }),
    800,
  )
  expect(model.turnedOnTracks.at(-1)!.model).toMatchObject({
    id: 'reference-row',
    name: 'seq2',
  })
})
