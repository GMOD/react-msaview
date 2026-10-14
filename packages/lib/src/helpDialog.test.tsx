// @vitest-environment jsdom
import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest'

import MSAView from './components/Loading.tsx'
import { keyboardControls } from './components/controls.ts'
import { onMsaKey } from './components/msa/msaKeys.ts'
import MSAModelF from './model.ts'

import type { MsaViewModel } from './model.ts'
import type { Root } from 'react-dom/client'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    const ctx: Record<PropertyKey, unknown> = {
      canvas: this,
      font: '12px sans-serif',
      measureText: (t: string) => ({ width: t.length * 7 }),
    }
    return new Proxy(ctx, {
      get: (target, prop) => (prop in target ? target[prop] : () => {}),
    }) as unknown as CanvasRenderingContext2D
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
})

const msa = '>a\nACGTACGT\n>b\nACGAACGT\n'

let container: HTMLDivElement
let root: Root
let model: MsaViewModel

function mount(data: { msa: string; tree?: string }) {
  model = MSAModelF().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    height: 200,
    data,
  })
  model.setWidth(800)
  act(() => {
    root.render(<MSAView model={model} />)
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

function button(name: string) {
  return [...document.querySelectorAll('button')].find(
    b =>
      b.getAttribute('aria-label') === name || b.textContent?.trim() === name,
  )
}

async function click(el: Element | undefined) {
  expect(el).toBeTruthy()
  await act(async () => {
    ;(el as HTMLElement).click()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

async function waitForText(text: string) {
  for (let i = 0; i < 50; i++) {
    if (document.body.textContent?.includes(text)) {
      return
    }
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })
  }
  throw new Error(`"${text}" never appeared`)
}

test('every listed key is one onMsaKey handles', () => {
  mount({ msa })
  model.setSelection({ start: 0, end: 2 })
  for (const { keys, shiftKey = false } of keyboardControls) {
    for (const key of keys) {
      expect([key, onMsaKey(model, { key, shiftKey })]).toEqual([key, true])
    }
  }
})

test('? opens the controls, and the credits from there', async () => {
  mount({ msa })
  await click(button('Mouse & keyboard help'))
  await waitForText('Shift + drag')
  expect(document.body.textContent).toContain('Home and End')
  await click(button('About & credits'))
  await waitForText('biotite')
})

test('the alignment names its keys to a screen reader', () => {
  mount({ msa })
  const label = container
    .querySelector('[data-testid="msa_canvas"]')
    ?.getAttribute('aria-label')
  expect(label).toContain('Arrow keys: Scroll one cell')
})
