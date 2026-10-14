import { expect, test } from 'vitest'

import { loadJsdom } from './loadJsdom.ts'

test('loading jsdom leaves the dispatcher behind fetch alone', async () => {
  const key = Symbol.for('undici.globalDispatcher.1')
  const before = (globalThis as Record<symbol, unknown>)[key]
  const { JSDOM } = await loadJsdom()
  expect((globalThis as Record<symbol, unknown>)[key]).toBe(before)
  expect(new JSDOM('<p>x</p>').window.document.body.textContent).toBe('x')
})
