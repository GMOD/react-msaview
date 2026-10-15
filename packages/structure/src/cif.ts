export type Vec3 = [number, number, number]

/** CA position by `label_seq_id`, for each chain a structure file holds */
export type CaCoordinates = Map<string, Map<number, Vec3>>

function add(
  chains: CaCoordinates,
  chain: string,
  labelSeqId: number,
  position: Vec3,
) {
  const residues = chains.get(chain) ?? new Map<number, Vec3>()
  residues.set(labelSeqId, position)
  chains.set(chain, residues)
}

const TOKEN = /'[^']*'|"[^"]*"|\S+/g

/**
 * The CA atoms of the first model of an mmCIF file, keyed by chain. A chain is
 * filed under both its `label_asym_id` and its `auth_asym_id`, since a
 * generated mapping names the chain by the author id and a hand-written one by
 * the label id, and a label id wins where the two collide. Only `ATOM` records count, so a calcium ion is not a CA, and
 * the first alternate location wins. Undefined when the text holds no
 * `_atom_site` loop, as with a file in PDB format.
 */
export function parseCaCoordinates(cif: string): CaCoordinates | undefined {
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
  const alt = col('label_alt_id')
  const model = col('pdbx_PDB_model_num')

  const byLabel: CaCoordinates = new Map()
  const byAuth: CaCoordinates = new Map()
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
    if (!line.startsWith('ATOM') || !line.includes(' CA ')) {
      continue
    }
    const t = line.match(TOKEN)
    if (!t || t[group!] !== 'ATOM' || t[atom!] !== 'CA') {
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
    add(byLabel, t[asym!]!, labelSeqId, position)
    if (auth !== undefined && t[auth] !== undefined) {
      add(byAuth, t[auth], labelSeqId, position)
    }
  }
  const chains: CaCoordinates = new Map(byAuth)
  for (const [chain, residues] of byLabel) {
    chains.set(chain, residues)
  }
  return chains
}
