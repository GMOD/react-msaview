// A Newick tool writes a FASTA name's colon as an underscore, so the tree's row
// `chr1_100-200` is the alignment's `chr1:100-200`
import { expect, test } from 'vitest'

import MSAModelF from './model.ts'

function makeModel(gff?: string) {
  const model = MSAModelF().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: {
      msa: '>chr1:100-200\nAC-GT\n>chr2:5-9\nACGGT',
      tree: '(chr1_100-200:1,chr2_5-9:1);',
      gff,
    },
  })
  model.setWidth(800)
  return model
}

test('row lookups resolve a tree name written with an underscore', () => {
  const model = makeModel()
  expect(model.rowNames).toEqual(['chr1_100-200', 'chr2_5-9'])
  expect(model.visibleColToRowLetter('chr1_100-200', 3)).toBe('G')
  expect(model.seqPosToGlobalCol('chr1_100-200', 2)).toBe(3)
})

test('a GFF naming the colon spelling lands on the underscored row', () => {
  const model = makeModel(
    '##gff-version 3\nchr1:100-200\tsrc\tdomain\t1\t3\t.\t.\t.\tName=d',
  )
  expect(Object.keys(model.annotationsByRow)).toEqual(['chr1_100-200'])
  expect(model.dataWarnings).toEqual([])
})
