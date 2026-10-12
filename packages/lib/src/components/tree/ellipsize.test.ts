import { expect, test } from 'vitest'

import { ellipsize } from './ellipsize.ts'

const measure = (text: string) => text.length * 10

test('a label that fits is drawn whole', () => {
  expect(ellipsize(measure, 'abcdef', 60, 60)).toEqual({
    text: 'abcdef',
    width: 60,
  })
})

test('a label that overflows keeps the prefix that fits beside the ellipsis', () => {
  expect(ellipsize(measure, 'abcdefghij', 100, 45)).toEqual({
    text: 'abc…',
    width: 40,
  })
})

test('a label with no room draws nothing', () => {
  expect(ellipsize(measure, 'abcdef', 60, 5)).toEqual({ text: '', width: 0 })
})
