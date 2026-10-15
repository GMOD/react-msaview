import {
  FOLDSEEK_MAX_RESIDUES,
  caCoordsToPdb,
  foldseekHitPairs,
  foldseekQuery,
  getStructureUrlFromTarget,
  hasValidCaCoords,
  isPdbId,
  searchFoldseek,
} from 'p2s_mapper'

import { generated } from './lookup.ts'
import { segmentsOfPairs } from './segments.ts'

import type { StructureCandidate } from './lookup.ts'
import type { FoldseekHit } from 'p2s_mapper'

// the client, the query and the hit alignment live in p2s_mapper, shared with
// the protein3d plugin
export { FOLDSEEK_MAX_RESIDUES, foldseekQuery, searchFoldseek }
export type { FoldseekHit }

function dataUrl(pdb: string) {
  return `data:chemical/x-pdb;charset=utf-8,${encodeURIComponent(pdb)}`
}

function describe(hit: FoldseekHit) {
  const [id = '', ...rest] = hit.target.split(' ')
  return { id, description: rest.join(' ') }
}

/**
 * Turns hits into candidates with a residue mapping each. Foldseek's alignment
 * of the query to the target is the correspondence, numbered by position in the
 * target's sequence.
 *
 * A target position is a `label_seq_id` only where the structure drawn is built
 * from that same sequence. An AlphaFold F1 model is the UniProt sequence, so it
 * opens from its own file. A PDB chain's database sequence holds only residues
 * with coordinates, so its position is not SEQRES numbering, and the hit's own
 * `tCa` trace, numbered 1..n by the same positions, is drawn instead.
 */
export function foldseekCandidates({
  rowName,
  rowSequence,
  hits,
  perDatabase = 4,
}: {
  rowName: string
  rowSequence: string
  hits: FoldseekHit[]
  perDatabase?: number
}): StructureCandidate[] {
  const query = foldseekQuery(rowSequence)
  const rowLength = rowSequence.replaceAll(/[-.]/g, '').length
  const taken = new Map<string, number>()
  const candidates: StructureCandidate[] = []
  for (const hit of hits) {
    if ((taken.get(hit.db) ?? 0) >= perDatabase) {
      continue
    }
    const pairs = foldseekHitPairs(hit, query)
    if (!pairs || pairs.length === 0) {
      continue
    }
    const { id, description } = describe(hit)
    const alphaFold = /^AF-[A-Z0-9]+(?:-\d+)?-F1-model_v\d+$/.test(id)
    const url = alphaFold
      ? getStructureUrlFromTarget(hit.target, hit.db)
      : undefined
    let structure
    if (url) {
      structure = {
        id: id.replace(/-model_v\d+$/, ''),
        kind: 'predicted' as const,
        asymId: 'A',
        asymIdKind: 'label' as const,
        url,
      }
    } else if (hasValidCaCoords(hit)) {
      const pdbId = isPdbId(id.slice(0, 4))
        ? id.slice(0, 4).toUpperCase()
        : undefined
      const chain = /_([A-Za-z0-9]+)$/.exec(id)?.[1]
      const name = pdbId ? `${pdbId}${chain ? `_${chain}` : ''}` : id
      structure = {
        id: `${name} (Foldseek)`,
        kind: pdbId ? ('experimental' as const) : ('predicted' as const),
        asymId: 'A',
        asymIdKind: 'label' as const,
        url: dataUrl(caCoordsToPdb(hit.tCa, hit.tSeq, 'A', name)),
      }
    } else {
      continue
    }
    taken.set(hit.db, (taken.get(hit.db) ?? 0) + 1)
    const identity = `${hit.seqId === undefined ? '?' : `${hit.seqId}%`} identity over ${pairs.length} residues, Foldseek 3Di+AA against ${hit.db}`
    candidates.push({
      kind: structure.kind,
      identity,
      label: `Foldseek · ${structure.id.replace(' (Foldseek)', '')} · ${hit.seqId === undefined ? '' : `${Math.round(hit.seqId)}% id · `}${hit.taxName ?? description}`,
      mapping: {
        row: rowName,
        rowLength,
        structure,
        segments: segmentsOfPairs(pairs),
        generated: generated(`Foldseek ${hit.db} ${id}, ${identity}`),
      },
    })
  }
  return candidates
}
