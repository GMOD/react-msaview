/**
 * The alignments behind the structure examples: globins and protein kinases,
 * each a set of proteins with a UniProt accession, aligned with ClustalW, plus
 * the alignment columns of the residues the examples highlight.
 *
 * Steps:
 *   1. Fetch each protein's sequence from UniProt.
 *   2. Align a set with ClustalW (apt install clustalw).
 *   3. Find each landmark residue by its position in one reference protein and
 *      write the file column it falls in, so a highlight sits on the same
 *      column of every row.
 *
 * Writes packages/examples/src/examples/structureAlignments.json.
 *
 *   node scripts/examples-gen/structureAlignments.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.resolve(
  here,
  '../../packages/examples/src/examples/structureAlignments.json',
)

const sets = {
  globins: {
    reference: 'HBA_HUMAN',
    proteins: [
      { row: 'HBA_HUMAN', accession: 'P69905', group: 'Hemoglobin' },
      { row: 'HBB_HUMAN', accession: 'P68871', group: 'Hemoglobin' },
      { row: 'MYG_HUMAN', accession: 'P02144', group: 'Myoglobin' },
      { row: 'NGB_HUMAN', accession: 'Q9NPG2', group: 'Neuroglobin' },
      { row: 'CYGB_HUMAN', accession: 'Q8WWM9', group: 'Cytoglobin' },
    ],
    // residues of the reference, by name; UniProt numbering, Met1 included
    landmarks: {
      'distal His (E7)': 59,
      'proximal His (F8)': 88,
      'E helix start': 54,
      'F helix end': 92,
    },
  },
  kinases: {
    // the alignment keeps each protein's kinase domain, which UniProt annotates,
    // since the rest differs from kinase to kinase and nothing there lines up
    domain: 'Protein kinase',
    reference: 'CDK2_HUMAN',
    proteins: [
      { row: 'CDK2_HUMAN', accession: 'P24941', group: 'CMGC' },
      { row: 'MK01_HUMAN', accession: 'P28482', group: 'CMGC' },
      { row: 'GSK3B_HUMAN', accession: 'P49841', group: 'CMGC' },
      { row: 'KAPCA_HUMAN', accession: 'P17612', group: 'AGC' },
      { row: 'AKT1_HUMAN', accession: 'P31749', group: 'AGC' },
      { row: 'PIM1_HUMAN', accession: 'P11309', group: 'CAMK' },
      { row: 'CHK1_HUMAN', accession: 'O14757', group: 'CAMK' },
      { row: 'AURKA_HUMAN', accession: 'O14965', group: 'Other' },
    ],
    landmarks: {
      'Gly-rich loop (GxGxxG)': 11,
      'catalytic Lys': 33,
      'HRD motif': 126,
      'DFG motif': 145,
    },
  },
}

async function uniprot(accession, domain) {
  const res = await fetch(
    `https://rest.uniprot.org/uniprotkb/${accession}.json`,
  )
  if (!res.ok) {
    throw new Error(`UniProt ${accession}: HTTP ${res.status}`)
  }
  const entry = await res.json()
  const sequence = entry.sequence.value
  if (!domain) {
    return { sequence, start: 1, end: sequence.length }
  }
  const found = entry.features.find(
    f => f.type === 'Domain' && f.description.startsWith(domain),
  )
  if (!found) {
    throw new Error(`${accession} has no ${domain} domain in UniProt`)
  }
  const start = found.location.start.value
  const end = found.location.end.value
  return { sequence: sequence.slice(start - 1, end), start, end }
}

function parseFasta(text) {
  const rows = []
  for (const block of text.split('>').slice(1)) {
    const [name, ...lines] = block.split('\n')
    rows.push({ name: name.trim(), seq: lines.join('') })
  }
  return rows
}

const out = {}
for (const [setName, set] of Object.entries(sets)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${setName}-`))
  const input = path.join(dir, 'in.fa')
  const aligned = path.join(dir, 'out.fa')
  const sequences = {}
  const ranges = {}
  let fasta = ''
  for (const protein of set.proteins) {
    const { row, accession } = protein
    const { sequence, start, end } = await uniprot(accession, set.domain)
    sequences[row] = sequence
    ranges[row] = { start, end }
    protein.range = [start, end]
    fasta += `>${row}\n${sequence}\n`
  }
  fs.writeFileSync(input, fasta)
  execFileSync('clustalw', [
    `-INFILE=${input}`,
    `-OUTFILE=${aligned}`,
    '-OUTPUT=FASTA',
    '-QUIET',
  ])
  const rows = parseFasta(fs.readFileSync(aligned, 'utf8'))
  const reference = rows.find(r => r.name === set.reference)
  if (!reference) {
    throw new Error(`${set.reference} is not in the ${setName} alignment`)
  }

  // file column (1-based) of the reference's residue n, in UniProt numbering
  const { start: kept, end: keptEnd } = ranges[set.reference]
  const columnOf = n => {
    if (n < kept || n > keptEnd) {
      throw new Error(`${set.reference} residue ${n} is outside its kept range`)
    }
    let residue = 0
    for (let c = 0; c < reference.seq.length; c++) {
      if (reference.seq[c] !== '-') {
        residue++
        if (residue === n - kept + 1) {
          return c + 1
        }
      }
    }
    throw new Error(`${set.reference} has no residue ${n}`)
  }
  const landmarks = Object.fromEntries(
    Object.entries(set.landmarks).map(([label, n]) => [
      label,
      {
        residue: n,
        letter: sequences[set.reference][n - kept],
        column: columnOf(n),
      },
    ]),
  )
  out[setName] = {
    reference: set.reference,
    proteins: set.proteins,
    msa: rows.map(r => `>${r.name}\n${r.seq}\n`).join(''),
    landmarks,
    provenance: {
      sequences:
        'UniProt REST, https://rest.uniprot.org/uniprotkb/<accession>.json' +
        (set.domain ? `, cut to each protein's "${set.domain}" domain` : ''),
      aligner: 'ClustalW, default parameters',
    },
  }
  console.log(
    setName,
    rows.length,
    'rows,',
    reference.seq.length,
    'columns;',
    Object.entries(landmarks)
      .map(([k, v]) => `${k}: ${v.letter}${v.residue} col ${v.column}`)
      .join('; '),
  )
}
fs.writeFileSync(outFile, `${JSON.stringify(out, null, 1)}\n`)
console.log('wrote', path.relative(process.cwd(), outFile))
