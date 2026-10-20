import { getUniprotIdFromAlphaFoldTarget } from 'p2s_mapper'

// UniProt's own pattern for an accession, from its "accession numbers" help
const ACCESSION =
  /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})(?:-\d+)?$/

/**
 * The UniProt accession a row name carries, or undefined. A FASTA header from
 * UniProt (`sp|P04637|P53_HUMAN`), an AlphaFold id (`AF-P04637-F1`) and a bare
 * `P04637/1-393` all name one, as does the Pfam-style `Q6YDQ7_9VIRU/46-492`,
 * whose entry name is an accession and a species code. An entry name such as
 * `HBA_HUMAN` and a RefSeq id do not, and finding the accession for those takes
 * a lookup.
 */
export function accessionOfRowName(name: string) {
  return rowNameTokens(name)
    .map(token => getUniprotIdFromAlphaFoldTarget(token) ?? token)
    .map(token => (ACCESSION.test(token) ? token : token.split('_')[0]!))
    .find(token => ACCESSION.test(token))
}

/**
 * The words of a row name a database id could be, split on the separators
 * FASTA headers use. A token with a colon, such as `UniProtKB:P04637`, comes
 * whole and then in its parts.
 */
export function rowNameTokens(name: string) {
  return name
    .split(/[|\s/,;]/)
    .flatMap(token =>
      token.includes(':') ? [token, ...token.split(':')] : [token],
    )
}
