export const sectionLabels: Record<string, string> = {
  General: 'Alignment',
  Accessions: 'Row accessions',
  Dbxref: 'Row cross-references',
}

export const gfLabels: Record<string, string> = {
  ID: 'Identifier',
  AC: 'Accession',
  DE: 'Description',
  AU: 'Authors',
  SE: 'Source of seed',
  SS: 'Source of structure',
  BM: 'Build method',
  SM: 'Search method',
  GA: 'Gathering threshold',
  TC: 'Trusted cutoff',
  NC: 'Noise cutoff',
  TP: 'Family type',
  CL: 'Clan',
  MB: 'Clan members',
  PI: 'Previous identifiers',
  DR: 'Database references',
  CC: 'Comment',
  WK: 'Wikipedia',
  NE: 'Pfam family nested in this one',
  NL: 'Nesting location',
  NH: 'Tree (Newick)',
  SQ: 'Number of sequences',
  RC: 'Reference comment',
  RN: 'Reference number',
  RM: 'PubMed ID',
  RT: 'Reference title',
  RA: 'Reference authors',
  RL: 'Reference journal',
  CB: 'Curation: build',
  DC: 'Database comment',
  DW: 'Database web link',
  OS: 'Organism',
  OC: 'Organism classification',
  AM: 'Alignment method',
  FT: 'Feature',
  SO: 'Sequence Ontology term',
}

export const referenceFieldLabels: Record<string, string> = {
  RT: 'Title',
  RA: 'Authors',
  RL: 'Journal',
  RM: 'PubMed',
  RC: 'Comment',
}

export const monospaceKeys = new Set(['NH'])
