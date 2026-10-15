import {
  isRecognizedDatabaseId,
  searchUniProtEntries,
  stripTrailingVersion,
} from 'p2s_mapper'

import { accessionOfRowName } from './accession.ts'

/**
 * A name a UniProt lookup can turn into an accession. `xref` is a database id
 * UniProt cross-references, such as a RefSeq protein, an Ensembl id or a CCDS,
 * and `entryName` is a UniProt entry name such as HBA_HUMAN.
 */
export type NameKind = 'entryName' | 'xref'

export interface RowIdentifier {
  kind: NameKind
  value: string
}

// HBA_HUMAN, P53_HUMAN: a gene mnemonic, an underscore, a species code
const ENTRY_NAME = /^[A-Z0-9]{1,10}_[A-Z0-9]{2,5}$/

/**
 * The names in a row's header a UniProt lookup could resolve, in the order the
 * header gives them. An accession is not one, since it needs no lookup. The
 * database ids are the ones p2s_mapper recognizes, which leaves out a RefSeq
 * `WP_` protein, since that names one sequence shared by every organism that
 * encodes it and not one entry.
 */
export function identifiersOfRowName(name: string): RowIdentifier[] {
  const tokens = name
    .split(/[|\s/,;]/)
    .flatMap(token =>
      token.includes(':') ? [token, ...token.split(':')] : [token],
    )
  const found: RowIdentifier[] = []
  for (const token of tokens) {
    const bare = stripTrailingVersion(token) ?? token
    const identifier: RowIdentifier | undefined = ENTRY_NAME.test(token)
      ? { kind: 'entryName', value: token }
      : isRecognizedDatabaseId(bare)
        ? { kind: 'xref', value: bare }
        : undefined
    if (
      identifier &&
      !found.some(
        f => f.kind === identifier.kind && f.value === identifier.value,
      )
    ) {
      found.push(identifier)
    }
  }
  return found
}

/** whether `findStructures` can proceed from this row name, directly or by lookup */
export function canFindStructures(name: string) {
  return (
    accessionOfRowName(name) !== undefined ||
    identifiersOfRowName(name).length > 0
  )
}

interface UniProtSearch {
  results?: {
    primaryAccession?: unknown
    entryType?: unknown
  }[]
}

function isReviewed(entryType: unknown) {
  return (
    typeof entryType === 'string' &&
    entryType.includes('reviewed') &&
    !entryType.includes('unreviewed')
  )
}

/**
 * The accession a UniProt search names, a reviewed entry before an unreviewed
 * one. A database id goes through p2s_mapper's cross-reference search, and an
 * entry name through UniProt's `id:` field, which p2s_mapper does not cover.
 */
export async function searchAccession(
  { kind, value }: RowIdentifier,
  signal?: AbortSignal,
) {
  const opts = signal ? { signal } : undefined
  if (kind === 'xref') {
    const { entries } = await searchUniProtEntries(
      { recognizedIds: [value] },
      opts,
    )
    return (entries.find(e => e.isReviewed) ?? entries[0])?.accession
  }
  const query = `id:${value}`
  const url = `https://rest.uniprot.org/uniprotkb/search?${new URLSearchParams({
    query,
    fields: 'accession',
    format: 'json',
    size: '5',
  })}`
  const res = await fetch(url, signal ? { signal } : undefined)
  if (!res.ok) {
    throw new Error(`UniProt answered ${res.status} for ${query}`)
  }
  const { results = [] } = (await res.json()) as UniProtSearch
  const found = results.find(r => isReviewed(r.entryType)) ?? results[0]
  return typeof found?.primaryAccession === 'string'
    ? found.primaryAccession
    : undefined
}
