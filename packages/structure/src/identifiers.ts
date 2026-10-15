import { accessionOfRowName } from './accession.ts'

/** a name a UniProt lookup can turn into an accession */
export type NameKind = 'entryName' | 'refseq'

export interface RowIdentifier {
  kind: NameKind
  value: string
}

// HBA_HUMAN, P53_HUMAN: a gene mnemonic, an underscore, a species code
const ENTRY_NAME = /^[A-Z0-9]{1,10}_[A-Z0-9]{2,5}$/
// NP_000549.1, XP_011516231: a RefSeq protein, with or without its version
const REFSEQ = /^(?:NP|XP|WP|YP|AP)_\d+(?:\.\d+)?$/

/**
 * The names in a row's header a UniProt lookup could resolve, in the order the
 * header gives them. An accession is not one, since it needs no lookup.
 */
export function identifiersOfRowName(name: string): RowIdentifier[] {
  return name.split(/[|\s/:,;]/).flatMap((token): RowIdentifier[] => {
    if (REFSEQ.test(token)) {
      return [{ kind: 'refseq', value: token.replace(/\.\d+$/, '') }]
    }
    return ENTRY_NAME.test(token) ? [{ kind: 'entryName', value: token }] : []
  })
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

/**
 * The accession a UniProt search names, a reviewed entry before an unreviewed
 * one. The query is by entry name or by RefSeq cross-reference, both of which
 * UniProt serves from the browser.
 */
export async function searchAccession(
  { kind, value }: RowIdentifier,
  signal?: AbortSignal,
) {
  const query = kind === 'entryName' ? `id:${value}` : `xref:refseq-${value}`
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
  const reviewed = results.find(
    r =>
      typeof r.entryType === 'string' &&
      r.entryType.includes('reviewed') &&
      !r.entryType.includes('unreviewed'),
  )
  const accession = (reviewed ?? results[0])?.primaryAccession
  return typeof accession === 'string' ? accession : undefined
}
