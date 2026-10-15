// @vitest-environment jsdom
import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, expect, test } from 'vitest'

import MSAModelF from '../../model.ts'
import MetadataDialog from './MetadataDialog.tsx'

import type { Root } from 'react-dom/client'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

let root: Root | undefined

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  document.body.innerHTML = ''
})

function render(msa: string, msaFormat: 'stockholm' | 'fasta') {
  const model = MSAModelF().create({
    type: 'MsaView',
    msaFormat,
    data: { msa },
  })
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root!.render(<MetadataDialog model={model} onClose={() => {}} />)
  })
  return document.body.textContent
}

test('lists stockholm headers by section and skips the empty ones', () => {
  const text = render(
    `# STOCKHOLM 1.0
#=GF DE Kinase domain
#=GS a AC P12345
a MKAANSE
b MKA-NSE
//
`,
    'stockholm',
  )
  expect(text).toContain('Kinase domain')
  expect(text).toContain('P12345')
  expect(text).toContain('Row accessions')
  expect(text).not.toContain('Dbxref')
})

test('says so when the alignment carries no metadata', () => {
  expect(render('>a\nMKAANSE\n>b\nMKA-NSE', 'fasta')).toContain(
    'This alignment has no metadata.',
  )
})

test('labels Stockholm tags and groups references', () => {
  const text = render(
    `# STOCKHOLM 1.0
#=GF AC PF00680
#=GF RN [1]
#=GF RM 29439438
#=GF RA Venkataraman S;
#=GF RL Viruses. 2018;
a MKAANSE
b MKA-NSE
//
`,
    'stockholm',
  )
  expect(text).toContain('Accession')
  expect(text).toContain('References')
  expect(text).toContain('PubMed')
  expect(text).toContain('Authors')
})
