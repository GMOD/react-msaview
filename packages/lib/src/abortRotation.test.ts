import { types } from '@jbrowse/mobx-state-tree'
import { expect, test } from 'vitest'

import { createAbortRotation } from './filehandleLoader.ts'

const node = () => types.model({}).create({})

test('a new begin aborts the previous fetch and closes its guard', () => {
  const rotation = createAbortRotation(node())
  const first = rotation.begin()
  const second = rotation.begin()
  expect(first.controller.signal.aborted).toBe(true)
  expect(first.isCurrent()).toBe(false)
  expect(second.isCurrent()).toBe(true)
})

test('cancel reports whether a fetch was running', () => {
  const rotation = createAbortRotation(node())
  expect(rotation.cancel()).toBe(false)
  const run = rotation.begin()
  expect(rotation.cancel()).toBe(true)
  expect(run.controller.signal.aborted).toBe(true)
  expect(run.isCurrent()).toBe(false)
})

test('a completed fetch closes its guard and is not cancelled', () => {
  const rotation = createAbortRotation(node())
  const run = rotation.begin()
  run.end()
  expect(run.isCurrent()).toBe(false)
  expect(rotation.cancel()).toBe(false)
})
