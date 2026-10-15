import { parseFoldseekResult } from 'p2s_mapper'
import { describe, expect, test } from 'vitest'

import { parsePdbCaCoordinates } from './cif.ts'
import { foldseekCandidates } from './foldseek.ts'

// a target of 6 residues; the query starts 1 residue in and skips one target
// residue (a gap in the query), so numbering must come from the alignment
const hits = (overrides: Record<string, unknown> = {}) => ({
  results: [
    {
      db: 'afdb-swissprot',
      alignments: [
        [
          {
            target: 'AF-P69907-F1-model_v6 Hemoglobin subunit alpha',
            seqId: 100,
            eval: 1e-18,
            qStartPos: 1,
            qEndPos: 4,
            dbStartPos: 2,
            dbEndPos: 6,
            qAln: 'AC-DE',
            dbAln: 'ACGDE',
            tCa: '1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6',
            tSeq: 'MACGDE',
            taxName: 'Homo sapiens',
            ...overrides,
          },
        ],
      ],
    },
    {
      db: 'pdb100',
      alignments: [
        [
          {
            target: '1c7c-assembly1.cif.gz_A deoxy hemoglobin',
            seqId: 98.5,
            eval: 2e-17,
            qStartPos: 1,
            qEndPos: 5,
            dbStartPos: 3,
            dbEndPos: 7,
            qAln: 'ACDEF',
            dbAln: 'ACDEF',
            tCa: '1,0,0,2,0,0,3,0,0,4,0,0,5,0,0,6,0,0,7,0,0',
            tSeq: 'GHACDEF',
            taxName: 'Homo sapiens',
          },
        ],
      ],
    },
  ],
})

describe('foldseekCandidates', () => {
  test('numbers an AlphaFold hit by target position, through the query map', () => {
    const [af] = foldseekCandidates({
      rowName: 'row',
      rowSequence: 'ACDE',
      hits: parseFoldseekResult(hits()),
    })
    expect(af?.mapping.structure).toMatchObject({
      id: 'AF-P69907-F1',
      kind: 'predicted',
      asymId: 'A',
      asymIdKind: 'label',
      url: 'https://alphafold.ebi.ac.uk/files/AF-P69907-F1-model_v6.cif',
    })
    // query A,C then a gap then D,E on target 2,3,(4 skipped),5,6
    expect(af?.mapping.segments).toEqual([
      { rowStart: 1, rowEnd: 2, structStart: 2, structEnd: 3 },
      { rowStart: 3, rowEnd: 4, structStart: 5, structEnd: 6 },
    ])
    expect(af?.mapping.rowLength).toBe(4)
  })

  test('draws a PDB hit from its own CA trace, numbered by target position', () => {
    const found = foldseekCandidates({
      rowName: 'row',
      rowSequence: 'ACDEF',
      hits: parseFoldseekResult(hits()),
    })
    const pdb = found.find(c => c.kind === 'experimental')!
    expect(pdb.mapping.structure.id).toBe('1C7C_A (Foldseek)')
    const url = pdb.mapping.structure.url!
    expect(url.startsWith('data:chemical/x-pdb')).toBe(true)
    const trace = parsePdbCaCoordinates(
      decodeURIComponent(url.slice(url.indexOf(',') + 1)),
    )!
    // target residue 3 is the first aligned one, and it is row residue 1
    expect(trace.label.get('A')?.get(3)).toEqual([3, 0, 0])
    expect(pdb.mapping.segments).toEqual([
      { rowStart: 1, rowEnd: 5, structStart: 3, structEnd: 7 },
    ])
  })

  test('maps a query that skipped non-standard residues back to the row', () => {
    const [af] = foldseekCandidates({
      rowName: 'row',
      // X is row residue 2, left out of the query, so query position 2 is row 3
      rowSequence: 'AXCDE',
      hits: parseFoldseekResult(
        hits({ qAln: 'ACDE', dbAln: 'ACDE', dbEndPos: 5 }),
      ),
    })
    expect(af?.mapping.segments).toEqual([
      { rowStart: 1, rowEnd: 1, structStart: 2, structEnd: 2 },
      { rowStart: 3, rowEnd: 5, structStart: 3, structEnd: 5 },
    ])
  })

  test('drops a hit whose alignment disagrees with its own positions', () => {
    const found = foldseekCandidates({
      rowName: 'row',
      rowSequence: 'ACDE',
      hits: parseFoldseekResult(hits({ qEndPos: 9 })),
    })
    expect(found.map(c => c.kind)).toEqual(['experimental'])
  })

  test('takes at most perDatabase hits from each database', () => {
    const one = parseFoldseekResult(hits())
    const many = Array.from({ length: 6 }, () => one[0]!)
    expect(
      foldseekCandidates({
        rowName: 'row',
        rowSequence: 'ACDE',
        hits: many,
        perDatabase: 2,
      }),
    ).toHaveLength(2)
  })
})
