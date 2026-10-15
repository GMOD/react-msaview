/**
 * One Foldseek search, recorded, for the example that replays it: human
 * myoglobin's sequence (UniProt P02144) against AlphaFold DB Swiss-Prot and
 * the PDB, keeping the best few hits of each database.
 *
 * The search sends the sequence to 3di.foldseek.com and search.foldseek.com
 * and waits for their queue, which the example must not do on every page load,
 * so the hits it maps are the ones this script saved.
 *
 * Writes packages/examples/src/examples/foldseekMyoglobin.json.
 *
 *   node scripts/examples-gen/foldseekHits.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { searchFoldseek } from '../../packages/structure/node_modules/p2s_mapper/esm/index.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.resolve(
  here,
  '../../packages/examples/src/examples/foldseekMyoglobin.json',
)
const accession = 'P02144'
const perDatabase = 4

const res = await fetch(`https://rest.uniprot.org/uniprotkb/${accession}.fasta`)
if (!res.ok) {
  throw new Error(`UniProt ${accession}: HTTP ${res.status}`)
}
const sequence = (await res.text()).split('\n').slice(1).join('')
const hits = await searchFoldseek(sequence, {
  onStatus: message => {
    console.log(message)
  },
})
// the fields foldseekCandidates reads
const fields = [
  'db',
  'target',
  'seqId',
  'eval',
  'qStartPos',
  'qEndPos',
  'dbStartPos',
  'dbEndPos',
  'qAln',
  'dbAln',
  'tCa',
  'tSeq',
  'taxName',
]
const kept = []
const taken = new Map()
for (const hit of hits) {
  const n = taken.get(hit.db) ?? 0
  if (n < perDatabase) {
    taken.set(hit.db, n + 1)
    kept.push(Object.fromEntries(fields.map(f => [f, hit[f]])))
  }
}
fs.writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      accession,
      sequence,
      searched: new Date().toISOString().slice(0, 10),
      hits: kept,
    },
    null,
    1,
  )}\n`,
)
console.log(
  `wrote ${kept.length} hits (${[...taken].map(([db, n]) => `${n} ${db}`).join(', ')}) to ${path.relative(process.cwd(), outFile)}`,
)
