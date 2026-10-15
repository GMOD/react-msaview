import {
  caCoordsToPdb,
  getStructureUrlFromTarget,
  hasValidCaCoords,
} from 'p2s_mapper'

import { pairsOfAlignment, segmentsOfPairs } from './segments.ts'

import type { StructureCandidate } from './lookup.ts'

/** the 3Di predictor takes at most this many residues */
export const FOLDSEEK_MAX_RESIDUES = 1200

export const FOLDSEEK_DATABASES = [
  { id: 'pdb100', label: 'PDB' },
  { id: 'afdb-swissprot', label: 'AlphaFold DB, Swiss-Prot' },
  { id: 'afdb50', label: 'AlphaFold DB, 50% clusters' },
  { id: 'afdb-proteome', label: 'AlphaFold DB, proteomes' },
  { id: 'cath50', label: 'CATH' },
] as const

export const DEFAULT_FOLDSEEK_DATABASES = ['pdb100', 'afdb-swissprot']

const STANDARD = /[ACDEFGHIKLMNPQRSTVWY]/

export interface FoldseekHit {
  db: string
  /** the target's id followed by its description, as Foldseek names it */
  target: string
  /** percent identity over the alignment */
  seqId?: number
  eval?: number
  /** 1-based positions in the cleaned query and in the target's sequence */
  qStartPos: number
  qEndPos: number
  dbStartPos: number
  dbEndPos: number
  qAln: string
  dbAln: string
  tCa?: string
  tSeq?: string
  taxName?: string
}

export type FoldseekFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>

interface Query {
  /** the row's standard residues, with the others left out */
  sequence: string
  /** the row residue (1-based, gaps not counted) of each query position */
  rowResidue: number[]
}

/**
 * The query Foldseek can take from a row: its twenty standard amino acids in
 * order. A residue the predictor cannot read (X, U, B) is left out, so a hit's
 * positions need the map back to the row's own numbering.
 */
export function foldseekQuery(rowSequence: string): Query {
  let residue = 0
  let sequence = ''
  const rowResidue: number[] = []
  for (const letter of rowSequence.toUpperCase()) {
    if (letter === '-' || letter === '.') {
      continue
    }
    residue++
    if (STANDARD.test(letter)) {
      sequence += letter
      rowResidue.push(residue)
    }
  }
  return { sequence, rowResidue }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberOf(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function parseHit(db: string, raw: unknown): FoldseekHit | undefined {
  if (!isRecord(raw) || typeof raw.target !== 'string') {
    return undefined
  }
  const qStartPos = numberOf(raw.qStartPos)
  const qEndPos = numberOf(raw.qEndPos)
  const dbStartPos = numberOf(raw.dbStartPos)
  const dbEndPos = numberOf(raw.dbEndPos)
  if (
    qStartPos === undefined ||
    qEndPos === undefined ||
    dbStartPos === undefined ||
    dbEndPos === undefined ||
    typeof raw.qAln !== 'string' ||
    typeof raw.dbAln !== 'string'
  ) {
    return undefined
  }
  return {
    db,
    target: raw.target,
    seqId: numberOf(raw.seqId),
    eval: numberOf(raw.eval),
    qStartPos,
    qEndPos,
    dbStartPos,
    dbEndPos,
    qAln: raw.qAln,
    dbAln: raw.dbAln,
    tCa: typeof raw.tCa === 'string' ? raw.tCa : undefined,
    tSeq: typeof raw.tSeq === 'string' ? raw.tSeq : undefined,
    taxName: typeof raw.taxName === 'string' ? raw.taxName : undefined,
  }
}

/** the hits of one query, from the body of `/api/result/<ticket>/0` */
export function parseFoldseekResult(body: unknown): FoldseekHit[] {
  const results = isRecord(body) ? body.results : undefined
  if (!Array.isArray(results)) {
    throw new Error('Foldseek returned a result with no list of databases')
  }
  return results.flatMap(result => {
    if (!isRecord(result) || typeof result.db !== 'string') {
      return []
    }
    const rows = Array.isArray(result.alignments) ? result.alignments : []
    const first: unknown = rows[0]
    return (Array.isArray(first) ? first : []).flatMap(raw => {
      const hit = parseHit(result.db as string, raw)
      return hit ? [hit] : []
    })
  })
}

const form = { 'Content-Type': 'application/x-www-form-urlencoded' }

/**
 * Searches Foldseek with the sequence and its predicted 3Di string. This sends
 * the sequence to search.foldseek.com and 3di.foldseek.com, and waits for a
 * queue, so a caller offers it as an explicit action.
 */
export async function searchFoldseek({
  sequence,
  databases = DEFAULT_FOLDSEEK_DATABASES,
  signal,
  onStatus,
  fetchImpl = (input, init) => fetch(input, init),
  timeoutMs = 180_000,
  pollMs = 1000,
}: {
  sequence: string
  databases?: string[]
  signal?: AbortSignal
  onStatus?: (status: string) => void
  fetchImpl?: FoldseekFetch
  timeoutMs?: number
  pollMs?: number
}): Promise<FoldseekHit[]> {
  const init = (extra: RequestInit = {}): RequestInit => ({ ...extra, signal })
  const failed = async (res: Response, what: string) =>
    new Error(
      `${what} answered ${res.status} ${await res.text().catch(() => '')}`.trim(),
    )

  onStatus?.('Predicting 3Di')
  const di = await fetchImpl(
    `https://3di.foldseek.com/predict/${encodeURIComponent(sequence)}`,
    init(),
  )
  if (!di.ok) {
    throw await failed(di, 'The 3Di predictor')
  }
  const di3 = (await di.text()).replaceAll(/["'\s/]/g, '')

  const body = new URLSearchParams()
  body.append('q', `>query\n${sequence}\n>3DI\n${di3}\n`)
  body.append('mode', '3diaa')
  body.append('email', '')
  for (const db of databases) {
    body.append('database[]', db)
  }
  onStatus?.('Submitting the search')
  const ticketRes = await fetchImpl(
    'https://search.foldseek.com/api/ticket',
    init({ method: 'POST', headers: form, body }),
  )
  if (!ticketRes.ok) {
    throw await failed(ticketRes, 'Foldseek')
  }
  // a refusal (RATELIMIT, MAINTENANCE) comes back as a 200 without an id
  const text = await ticketRes.text()
  let ticket: unknown
  try {
    ticket = JSON.parse(text)
  } catch {
    ticket = undefined
  }
  const ticketId =
    isRecord(ticket) && typeof ticket.id === 'string' ? ticket.id : undefined
  if (!ticketId) {
    throw new Error(`Foldseek did not accept the search: ${text.slice(0, 200)}`)
  }

  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new DOMException('The search was cancelled', 'AbortError')
    }
    const res = await fetchImpl(
      'https://search.foldseek.com/api/tickets',
      init({
        method: 'POST',
        headers: form,
        body: new URLSearchParams({ 'tickets[]': ticketId }),
      }),
    )
    if (!res.ok) {
      throw await failed(res, 'Foldseek')
    }
    const status: unknown = (await res.json())?.[0]
    const state = isRecord(status) ? status.status : undefined
    if (state === 'COMPLETE') {
      onStatus?.('Reading the hits')
      const result = await fetchImpl(
        `https://search.foldseek.com/api/result/${ticketId}/0`,
        init(),
      )
      if (!result.ok) {
        throw await failed(result, 'Foldseek')
      }
      return parseFoldseekResult(await result.json())
    }
    if (state !== 'PENDING' && state !== 'RUNNING') {
      throw new Error(
        `Foldseek search failed: ${isRecord(status) && typeof status.error === 'string' ? status.error : String(state)}`,
      )
    }
    onStatus?.(
      `Searching (${Math.round((Date.now() - startedAt) / 1000)} s, ${String(state).toLowerCase()})`,
    )
    await new Promise(resolve => setTimeout(resolve, pollMs))
  }
  throw new Error(
    `Foldseek search timed out after ${Math.round(timeoutMs / 1000)} s`,
  )
}

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
  const date = new Date().toISOString().slice(0, 10)
  for (const hit of hits) {
    if ((taken.get(hit.db) ?? 0) >= perDatabase) {
      continue
    }
    const aligned = hit.qAln.replaceAll('-', '').length
    if (aligned !== hit.qEndPos - hit.qStartPos + 1) {
      continue
    }
    const pairs = pairsOfAlignment(hit.qAln, hit.dbAln).flatMap(
      ([q, t]): [number, number][] => {
        const row = query.rowResidue[hit.qStartPos - 1 + q - 1]
        return row === undefined ? [] : [[row, hit.dbStartPos - 1 + t]]
      },
    )
    if (pairs.length === 0) {
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
      const pdbId = /^([1-9][a-z0-9]{3})/i.exec(id)?.[1]?.toUpperCase()
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
        generated: {
          by: `react-msaview-structure: Foldseek ${hit.db} ${id}, ${identity}`,
          date,
        },
      },
    })
  }
  return candidates
}
