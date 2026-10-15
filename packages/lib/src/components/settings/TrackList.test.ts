import { expect, test } from 'vitest'

import MSAModelF from '../../model.ts'
import { trackGroups } from './TrackList.tsx'

const stockholm = `# STOCKHOLM 1.0
a        ACGUAC
b        ACGUAC
c        ACGUAC
#=GR a SS    <<..>>
#=GR b SS    <<..>>
#=GR c SS    <<..>>
#=GR a pAS   ..*...
#=GC SS_cons <<..>>
//
`

test('per-row lines group into one entry per tag', () => {
  const model = MSAModelF().create({
    type: 'MsaView',
    data: { msa: stockholm },
  })
  const rows = trackGroups(model).find(g => g.title === 'Per-row annotations')
  expect(rows?.entries.map(e => [e.label, e.ids.length])).toEqual([
    ['SS (3 rows)', 3],
    ['pAS (1 row)', 1],
  ])
  const [ss] = rows!.entries
  model.setTracksShown(ss!.ids, true)
  expect(
    model.turnedOnTracks.filter(t => t.model.associatedRowName),
  ).toHaveLength(3)
})
