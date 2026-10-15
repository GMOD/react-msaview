// UniProt's own pattern for an accession, from its "accession numbers" help
const ACCESSION =
  /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})(?:-\d+)?$/

/**
 * The UniProt accession a row name carries, or undefined. A FASTA header from
 * UniProt (`sp|P04637|P53_HUMAN`), an AlphaFold id (`AF-P04637-F1`) and a bare
 * `P04637/1-393` all name one. An entry name such as `HBA_HUMAN` and a RefSeq
 * id do not, and finding the accession for those takes a lookup.
 */
export function accessionOfRowName(name: string) {
  return name
    .split(/[|\s/:,;]/)
    .map(token =>
      token.startsWith('AF-') ? (token.slice(3).split('-F')[0] ?? '') : token,
    )
    .find(token => ACCESSION.test(token))
}
