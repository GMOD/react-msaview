import { describe, expect, test } from 'vitest'

import { parsePdbCaCoordinates } from './cif.ts'
import {
  foldseekCandidates,
  foldseekQuery,
  parseFoldseekResult,
  searchFoldseek,
} from './foldseek.ts'

import type { FoldseekFetch } from './foldseek.ts'

describe('foldseekQuery', () => {
  test('keeps the standard residues and maps them back to the row', () => {
    const query = foldseekQuery('MK-XA.UV')
    expect(query.sequence).toBe('MKAV')
    // X and U are row residues 3 and 5 of the ungapped row MKXAUV
    expect(query.rowResidue).toEqual([1, 2, 4, 6])
  })
})

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
    expect(trace.get('A')?.get(3)).toEqual([3, 0, 0])
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

describe('searchFoldseek', () => {
  function fakeFetch(states: string[], seen: string[] = []): FoldseekFetch {
    let poll = 0
    return (input, init) => {
      seen.push(`${init?.method ?? 'GET'} ${input.split('?')[0]!.slice(0, 60)}`)
      if (input.startsWith('https://3di.foldseek.com/predict/')) {
        return Promise.resolve(new Response('"DDPVV"'))
      }
      if (input.endsWith('/api/ticket')) {
        const body = String(init?.body)
        expect(body).toContain('mode=3diaa')
        expect(decodeURIComponent(body)).toContain('>3DI\nDDPVV')
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'T1', status: 'PENDING' })),
        )
      }
      if (input.endsWith('/api/tickets')) {
        const status = states[Math.min(poll++, states.length - 1)]
        return Promise.resolve(new Response(JSON.stringify([{ status }])))
      }
      return Promise.resolve(new Response(JSON.stringify(hits())))
    }
  }

  test('predicts, submits, polls until complete and reads the hits', async () => {
    const seen: string[] = []
    const status: string[] = []
    const found = await searchFoldseek({
      sequence: 'ACDEF',
      fetchImpl: fakeFetch(['PENDING', 'RUNNING', 'COMPLETE'], seen),
      onStatus: s => status.push(s),
      pollMs: 1,
    })
    expect(found.map(h => h.db)).toEqual(['afdb-swissprot', 'pdb100'])
    expect(seen.at(-1)).toContain('/api/result/T1/0')
    expect(status[0]).toBe('Predicting 3Di')
    expect(status.some(s => s.startsWith('Searching'))).toBe(true)
  })

  test('reports a refusal that arrives as a 200 with no ticket', async () => {
    const fetchImpl: FoldseekFetch = input =>
      Promise.resolve(
        new Response(
          input.includes('3di.')
            ? '"DD"'
            : JSON.stringify({ status: 'RATELIMIT' }),
        ),
      )
    await expect(
      searchFoldseek({ sequence: 'ACDEF', fetchImpl, pollMs: 1 }),
    ).rejects.toThrow('did not accept the search')
  })

  test('stops on a failed search with the server error', async () => {
    await expect(
      searchFoldseek({
        sequence: 'ACDEF',
        fetchImpl: fakeFetch(['ERROR']),
        pollMs: 1,
      }),
    ).rejects.toThrow('Foldseek search failed')
  })

  test('gives up after the time budget', async () => {
    await expect(
      searchFoldseek({
        sequence: 'ACDEF',
        fetchImpl: fakeFetch(['PENDING']),
        timeoutMs: 20,
        pollMs: 5,
      }),
    ).rejects.toThrow('timed out')
  })
})
