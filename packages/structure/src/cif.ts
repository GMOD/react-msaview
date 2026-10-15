export type Vec3 = [number, number, number]

/** CA position by `label_seq_id`, for each chain a structure file holds */
export type CaCoordinates = Map<string, Map<number, Vec3>>

/**
 * The CA atoms of the first model of a PDB-format file, by chain, numbered by
 * the residue sequence number. A Foldseek trace is numbered 1..n by target
 * position, so that number is its `label_seq_id`. Undefined when no CA is found.
 */
export function parsePdbCaCoordinates(pdb: string): CaCoordinates | undefined {
  const chains: CaCoordinates = new Map()
  for (const line of pdb.split('\n')) {
    if (line.startsWith('ENDMDL')) {
      break
    }
    const atom = line.startsWith('ATOM  ')
    if (
      !(atom || line.startsWith('HETATM')) ||
      line.slice(12, 16).trim() !== 'CA'
    ) {
      continue
    }
    const residue = line.slice(17, 20).trim()
    const alt = line[16] ?? ' '
    if ((!atom && residue === 'CA') || (alt !== ' ' && alt !== 'A')) {
      continue
    }
    const seq = Number(line.slice(22, 26))
    const position: Vec3 = [
      Number(line.slice(30, 38)),
      Number(line.slice(38, 46)),
      Number(line.slice(46, 54)),
    ]
    if (!Number.isInteger(seq) || !position.every(Number.isFinite)) {
      continue
    }
    const chain = (line[21] ?? ' ').trim() || 'A'
    const residues = chains.get(chain) ?? new Map<number, Vec3>()
    residues.set(seq, position)
    chains.set(chain, residues)
  }
  return chains.size > 0 ? chains : undefined
}

const TOKEN = /'[^']*'|"[^"]*"|\S+/g

/**
 * The CA atoms of the first model of an mmCIF file, keyed by chain. A chain is
 * filed under both its `label_asym_id` and its `auth_asym_id`, since a
 * generated mapping names the chain by the author id and a hand-written one by
 * the label id, and a label id wins where the two collide. A chain's label
 * and author entries are one map, so a lone chain counts once. `ATOM` records
 * and the `HETATM` records of modified residues such as selenomethionine
 * count, and a calcium ion does not, since its atom and residue are both `CA`.
 * The first alternate location wins, and a record with a coordinate that is
 * not a number is skipped. Undefined when the text holds no
 * `_atom_site` loop, as with a file in PDB format.
 */
export function parseCaCoordinates(cif: string): CaCoordinates | undefined {
  if (!cif.includes('_atom_site.')) {
    return parsePdbCaCoordinates(cif)
  }
  const lines = cif.split('\n')
  const columns = new Map<string, number>()
  let i = 0
  for (; i < lines.length; i++) {
    const line = lines[i]!
    if (line.startsWith('_atom_site.')) {
      columns.set(line.trim().slice('_atom_site.'.length), columns.size)
    } else if (columns.size > 0) {
      break
    }
  }
  const col = (name: string) => columns.get(name)
  const need = [
    'group_PDB',
    'label_atom_id',
    'label_asym_id',
    'label_seq_id',
    'Cartn_x',
    'Cartn_y',
    'Cartn_z',
  ].map(col)
  if (need.some(c => c === undefined)) {
    return undefined
  }
  const [group, atom, asym, seq, cx, cy, cz] = need as number[]
  const auth = col('auth_asym_id')
  const comp = col('label_comp_id')
  const alt = col('label_alt_id')
  const model = col('pdbx_PDB_model_num')

  const byLabel: CaCoordinates = new Map()
  const byAuth: CaCoordinates = new Map()
  const shared = new Map<string, Map<number, Vec3>>()
  let firstModel: string | undefined
  for (; i < lines.length; i++) {
    const line = lines[i]!
    if (
      line.startsWith('#') ||
      line.startsWith('loop_') ||
      line.startsWith('_')
    ) {
      break
    }
    if (
      !(line.startsWith('ATOM') || line.startsWith('HETATM')) ||
      !line.includes(' CA ')
    ) {
      continue
    }
    const t = line.match(TOKEN)
    if (!t || t[atom!] !== 'CA') {
      continue
    }
    const record = t[group!]
    const modified =
      record === 'HETATM' && comp !== undefined && t[comp] !== 'CA'
    if (record !== 'ATOM' && !modified) {
      continue
    }
    if (model !== undefined) {
      firstModel ??= t[model]
      if (t[model] !== firstModel) {
        continue
      }
    }
    const altId = alt === undefined ? '.' : t[alt]
    if (altId !== '.' && altId !== '?' && altId !== 'A') {
      continue
    }
    const labelSeqId = Number(t[seq!])
    if (!Number.isInteger(labelSeqId)) {
      continue
    }
    const position: Vec3 = [Number(t[cx!]), Number(t[cy!]), Number(t[cz!])]
    if (!position.every(Number.isFinite)) {
      continue
    }
    const label = t[asym!]!
    const author = auth === undefined ? label : (t[auth] ?? label)
    const pair = `${label}\u0000${author}`
    let residues = shared.get(pair)
    if (!residues) {
      residues = new Map<number, Vec3>()
      shared.set(pair, residues)
      byLabel.set(label, residues)
      byAuth.set(author, residues)
    }
    residues.set(labelSeqId, position)
  }
  const chains: CaCoordinates = new Map(byAuth)
  for (const [chain, residues] of byLabel) {
    chains.set(chain, residues)
  }
  return chains
}
