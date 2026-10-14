import { expect, test } from 'vitest'

import MSAModelF from './model.ts'

function sequenceType(msa: string) {
  return MSAModelF().create({
    type: 'MsaView',
    msaFormat: 'fasta',
    data: { msa },
  }).sequenceType
}

test('two-base IUPAC codes leave an alignment nucleotide', () => {
  expect(sequenceType('>a\nACGTRY\n>b\nACGTKM\n>c\nACGTSW')).toBe('dna')
  expect(sequenceType('>a\nACGURY\n>b\nACGUNN')).toBe('rna')
})

test('a protein alignment stays amino', () => {
  expect(sequenceType('>a\nMKAANSE\n>b\nMKA-NSE')).toBe('amino')
})
