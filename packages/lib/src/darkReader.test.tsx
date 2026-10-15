// @vitest-environment jsdom
import React, { act } from 'react'

import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test } from 'vitest'

import { useCanvasTheme } from './darkReader.ts'

import type { Theme } from '@mui/material/styles'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

function Probe() {
  const { palette } = useCanvasTheme()
  return `${palette.mode} ${palette.text.primary}`
}

function mount(theme: Theme) {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => {
    root.render(
      <ThemeProvider theme={theme}>
        <Probe />
      </ThemeProvider>,
    )
  })
  return {
    drawn: () => container.textContent,
    unmount: () => {
      act(() => {
        root.unmount()
      })
    },
  }
}

afterEach(() => {
  delete document.documentElement.dataset.darkreaderScheme
})

test('a light page Dark Reader darkens draws its canvases dark until it is switched off', async () => {
  const view = mount(createJBrowseTheme())
  expect(view.drawn()).toBe('light rgba(0, 0, 0, 0.87)')

  document.documentElement.dataset.darkreaderScheme = 'dark'
  await act(async () => {})
  expect(view.drawn()).toBe('dark #fff')

  delete document.documentElement.dataset.darkreaderScheme
  await act(async () => {})
  expect(view.drawn()).toBe('light rgba(0, 0, 0, 0.87)')
  view.unmount()
})

test("Dark Reader's light scheme, and a page already dark, keep their theme", () => {
  document.documentElement.dataset.darkreaderScheme = 'dimmed'
  const light = mount(createJBrowseTheme())
  expect(light.drawn()).toMatch(/^light/)
  light.unmount()

  document.documentElement.dataset.darkreaderScheme = 'dark'
  const dark = mount(
    createJBrowseTheme({
      palette: { mode: 'dark', text: { primary: '#eee' } },
    }),
  )
  expect(dark.drawn()).toBe('dark #eee')
  dark.unmount()
})
