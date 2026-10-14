// @vitest-environment jsdom
//
// The live overlay draws the selected block as a bordered band over the rows
// and columns it covers, and the SVG export leaves it out.
import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { enableStaticRendering } from 'mobx-react'
import { beforeAll, expect, test } from 'vitest'

import { renderSelection } from './components/msa/renderHighlights.ts'
import { installHeadlessRenderEnv } from './headlessRenderEnv.ts'
import MSAModelF from './model.ts'
import { renderToSvg } from './renderToSvg.tsx'

import type { RenderCtx } from './components/renderCtx.ts'
import type { MsaSelection } from './types.ts'

beforeAll(() => {
  enableStaticRendering(true)
  installHeadlessRenderEnv()
})

const msa = `>seq1
ACDEFGHIKL
>seq2
AC--FGHIKL
>seq3
ACDEFGHIKL
>seq4
ACDEFGHIKL`

function modelWith(selection?: MsaSelection) {
  const model = MSAModelF().create({
    id: 'block-svg-test',
    type: 'MsaView',
    height: 400,
    msaFormat: 'fasta',
    data: { msa },
    selection,
  })
  model.setWidth(800)
  return model
}

function drawnRects(selection: MsaSelection) {
  const model = modelWith(selection)
  const fills: number[][] = []
  const strokes: number[][] = []
  const ctx = {
    fillRect: (...r: number[]) => fills.push(r),
    strokeRect: (...r: number[]) => strokes.push(r),
  } as unknown as RenderCtx
  renderSelection({ ctx, model, offsetX: 0, offsetY: 0, height: 400 })
  return { model, fills, strokes }
}

test('the selected block draws as a bordered band over its cells', () => {
  const { model, fills, strokes } = drawnRects({
    start: 3,
    end: 5,
    rows: ['seq2', 'seq3'],
  })
  const { colWidth, rowHeight } = model
  const band = [2 * colWidth, rowHeight, 3 * colWidth, 2 * rowHeight]
  expect(fills).toEqual([band])
  expect(strokes).toEqual([band])
})

test('rows apart in the display draw as one band each', () => {
  const { model, fills } = drawnRects({
    start: 1,
    end: 2,
    rows: ['seq1', 'seq4'],
  })
  expect(fills.map(r => r[1])).toEqual([0, 3 * model.rowHeight])
})

test('the SVG export leaves the selected block out', async () => {
  const svg = await renderToSvg(
    modelWith({ start: 3, end: 5, rows: ['seq2', 'seq3'] }),
    { theme: createJBrowseTheme(), exportType: 'entire' },
  )
  expect(svg).not.toContain('rgb(25,118,210)')
})
