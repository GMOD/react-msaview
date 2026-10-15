// @vitest-environment jsdom
import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest'

import MSAView from './components/Loading.tsx'
import { keyboardControls } from './components/controls.ts'
import {
  gapsSubMenu,
  toolsMenuItems,
  treeSubMenu,
  viewMenuItems,
} from './components/header/menuBarItems.ts'
import { onMsaKey } from './components/msa/msaKeys.ts'
import MSAModelF from './model.ts'

import type { MsaViewModel } from './model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'
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

function testId(id: string) {
  return container.querySelector(`[data-testid="${id}"]`)
}
const tree = '(a:0.1,b:0.2);'

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

function menuItem(text: string) {
  return [...document.querySelectorAll('li')].find(
    li => li.textContent === text,
  )
}

test('Help opens the controls, and the credits from there', async () => {
  mount({ msa })
  await click(testId('help_menu') ?? undefined)
  await click(menuItem('Mouse & keyboard…'))
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

test('the menu bar reads File, View, Tools, Help', () => {
  mount({ msa })
  expect(
    ['file', 'view', 'tools', 'help'].map(
      n => testId(`${n}_menu`)?.textContent,
    ),
  ).toEqual(['File', 'View', 'Tools', 'Help'])
})

test('the track selector filters, and shows or hides what matches', async () => {
  mount({ msa })
  clickItem(viewMenuItems(model), 'Tracks…')
  await waitForText('Show all')
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="Filter tracks"]',
  )!
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, 'conservation')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await click(button('Hide all'))
  expect(
    model.turnedOnTracks.filter(t =>
      t.model.name.toLowerCase().includes('conservation'),
    ),
  ).toEqual([])
  await click(button('Show all'))
  expect(
    model.turnedOnTracks.filter(t =>
      t.model.name.toLowerCase().includes('conservation'),
    ).length,
  ).toBeGreaterThan(0)
})

test('View → Zoom resets the zoom', () => {
  mount({ msa })
  const { colWidth } = model
  model.zoomIn()
  expect(model.colWidth).not.toBe(colWidth)
  clickItem(subMenuItems(viewMenuItems(model), 'Zoom'), 'Reset zoom')
  expect(model.colWidth).toBe(colWidth)
})

function subMenuItems(items: MenuItem[], label: string) {
  const item = items.find(i => 'label' in i && i.label === label)
  return item && 'subMenu' in item && Array.isArray(item.subMenu)
    ? item.subMenu
    : []
}

function clickItem(items: MenuItem[], label: string) {
  const item = items.find(i => 'label' in i && i.label === label)
  expect(item).toBeTruthy()
  act(() => {
    if (item && 'onClick' in item) {
      item.onClick()
    }
  })
}

test('the header checkbox and View → Zoom both turn zoom on scroll on', async () => {
  mount({ msa })
  const box = testId('scroll-zoom-toggle')?.querySelector('input')
  await click(box ?? undefined)
  expect(model.scrollZoom).toBe(true)
  clickItem(subMenuItems(viewMenuItems(model), 'Zoom'), 'Zoom on scroll')
  expect(model.scrollZoom).toBe(false)
})

test('the gappy columns presets set the threshold, and Show all clears it', () => {
  mount({ msa: '>a\nAC-T\n>b\nA--T\n>c\nACGT\n' })
  expect(testId('hidden_columns_chip')).toBeNull()
  clickItem(gapsSubMenu(model), 'Hide ≥50% gaps')
  expect([model.hideGaps, model.allowedGappyness]).toEqual([true, 50])
  expect(testId('hidden_columns_chip')?.textContent).toBe(
    '1 gappy column hidden',
  )
  clickItem(gapsSubMenu(model), 'Show all columns')
  expect(model.hideGaps).toBe(false)
  expect(testId('hidden_columns_chip')).toBeNull()
})

test('View → Tree picks one of three layouts', () => {
  mount({ msa, tree })
  clickItem(treeSubMenu(model), 'Cladogram')
  expect([model.drawTree, model.showBranchLen]).toEqual([true, false])
  clickItem(treeSubMenu(model), 'Labels only')
  expect(model.drawTree).toBe(false)
  clickItem(treeSubMenu(model), 'Phylogram')
  expect([model.drawTree, model.showBranchLen]).toEqual([true, true])
})

test('View offers Tree only with a tree, and Tools builds one', () => {
  mount({ msa })
  expect(subMenuItems(viewMenuItems(model), 'Tree')).toEqual([])
  expect(toolsMenuItems(model).map(i => 'label' in i && i.label)).toContain(
    'Build neighbor joining tree',
  )
})
