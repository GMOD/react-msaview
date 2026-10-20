import { colord, extend } from 'colord'
import labPlugin from 'colord/plugins/lab'
import { expect, test } from 'vitest'

import MSAModelF from './model.ts'

import type { Annotation } from './types.ts'

extend([labPlugin])

const msa = `>human
${'A'.repeat(800)}
>frog
${'A'.repeat(800)}`

// The CDD Regions and Sites of human BRAF (NP_004324.2) in GenPept order, then
// those of an ortholog whose record names other CDD models. A site's accession
// is its domain's CDD id, a colon and its name, as jbrowse-plugin-msaview
// writes it.
const records: [row: string, type: string, cdd: string, name: string][] = [
  ['human', 'Region', '340654', 'RBD_BRAF'],
  ['human', 'Site', '340654', 'Raf-Ras interaction site'],
  ['human', 'Site', '340654', 'Raf-KRas interaction site'],
  ['human', 'Site', '340654', 'homodimer interface'],
  ['human', 'Site', '340654', 'Ca binding site'],
  ['human', 'Region', '410421', 'C1_B-Raf'],
  ['human', 'Region', '270964', 'STKc_Raf'],
  ['human', 'Site', '270964', 'active'],
  ['human', 'Site', '270964', 'ATP binding site'],
  ['human', 'Site', '270964', 'polypeptide substrate binding site'],
  ['human', 'Site', '270964', 'dimer interface'],
  ['human', 'Site', '270964', 'activation loop'],
  ['frog', 'Region', '410420', 'C1'],
  ['frog', 'Region', '214800', 'DERM'],
  ['frog', 'Region', '271051', 'STKc_B-Raf'],
  ['frog', 'Site', '271051', 'active'],
  ['frog', 'Site', '271051', 'ATP binding site'],
  ['frog', 'Site', '271051', 'polypeptide substrate binding site'],
  ['frog', 'Site', '271051', 'dimer interface'],
  ['frog', 'Site', '271051', 'activation loop'],
]

const annotations: Annotation[] = records.map(([id, type, cdd, name], i) => ({
  id,
  accession: type === 'Region' ? cdd : `${cdd}:${name}`,
  name,
  description: name,
  featureType: type,
  start: i * 30 + 1,
  end: i * 30 + 20,
}))

function fills(features: Annotation[]) {
  const model = MSAModelF().create({
    id: 'domain-palette-test',
    type: 'MsaView',
    height: 400,
    msaFormat: 'fasta',
    data: { msa },
  })
  model.setWidth(800)
  model.setAnnotations(features)
  const { fillPalette } = model
  const lightness = (type: string) =>
    features
      .filter(f => f.featureType === type)
      .map(f => colord(fillPalette[f.accession]!).toLab().l)
  return { domains: lightness('Region'), sites: lightness('Site') }
}

// A site draws as single columns on the alignment and as side chains on a
// structure, and a thin mark shows on a fill only through lightness contrast
test('every site is darker than every domain', () => {
  const { domains, sites } = fills(annotations)
  expect(Math.min(...domains)).toBeGreaterThanOrEqual(75)
  expect(Math.max(...sites)).toBeLessThanOrEqual(50)
})

test('past the end of the palettes, sites stay dark and domains light', () => {
  const many = Array.from({ length: 12 }, (_, i) => [
    {
      ...annotations[0]!,
      accession: `domain${i}`,
      featureType: 'Region',
    },
    { ...annotations[1]!, accession: `site${i}`, featureType: 'Site' },
  ]).flat()
  const { domains, sites } = fills(many)
  expect(Math.min(...domains)).toBeGreaterThanOrEqual(75)
  expect(Math.max(...sites)).toBeLessThanOrEqual(50)
})
