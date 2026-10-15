import { expect, test } from 'vitest'

import { MSAModelF } from './index.ts'

const stockholm = `# STOCKHOLM 1.0
#=GC SS_cons <<..>>
#=GC RF      xxxxxx
#=GR a pAS   ..*...
a  ACGTAC
b  ACGTAC
//
`

function makeModel() {
  return MSAModelF().create({
    id: 'x',
    type: 'MsaView',
    data: { msa: stockholm },
  })
}

test('a Stockholm #=GC line is a track, shown', () => {
  const model = makeModel()
  expect(model.turnedOnTracks.map(t => t.model.id)).toContain('gc-RF')
})

test('a #=GR line is an annotation on its row, hidden until turned on', () => {
  const model = makeModel()
  expect(model.tracks.map(t => t.model.id)).not.toContain('gr-a-pAS')
  expect(model.allAnnotations.map(a => [a.id, a.name, a.start])).toEqual([
    ['a', 'pAS', 3],
  ])
  // hidden, so the residues keep the cells
  expect(model.filteredAnnotations).toEqual([])
  expect(model.cellFill).toBe('residue')

  model.setFilter('pAS', true)
  expect(model.filteredAnnotations).toHaveLength(1)
  expect(model.cellFill).toBe('domain')
  model.setFilter('pAS', false)
  expect(model.turnedOffFeatures.size).toBe(0)
})
