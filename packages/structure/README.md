# react-msaview-structure

- **In:** a `react-msaview` model, and a row's UniProt accession
- **Out:** the AlphaFold and PDB structures of that row with the residue mapping
  onto each, and a Mol\* panel linked to the alignment

## Find a row's structures

```ts
import { findStructures } from 'react-msaview-structure'

const { candidates, problem } = await findStructures({
  rowName: 'sp|P04637|P53_HUMAN',
  rowSequence: model.rowSequence('sp|P04637|P53_HUMAN') ?? '',
})
model.setResidueMappings([...model.residueMappings, candidates[0].mapping])
```

- The row names its UniProt entry, or the caller passes `accession`
- A row named by an entry name (`HBA_HUMAN`) or a RefSeq protein id
  (`NP_000549.1`) is looked up in UniProt by that name, a reviewed entry first,
  and `resolvedFrom` in the result says which name it came from
- The row is then checked against the entry it resolved to, so a wrong name gets
  no mapping
- AlphaFold DB and RCSB answer the lookups, both from the browser
- The row is aligned once to the entry's canonical sequence, and each
  candidate's `segments` compose that alignment with the structure's own
  numbering (`label_seq_id`)
- A row that does not match its entry gets no candidates and a `problem`
- A generated mapping names its chain by the author id RCSB reports

## Superpose rows by the alignment

```ts
import { superposeRows } from 'react-msaview-structure'

const fit = await superposeRows({
  model,
  targets: [
    { row: 'HBA_HUMAN', structureId: 'AF-P69905-F1' },
    { row: 'HBB_HUMAN', structureId: 'AF-P68871-F1' },
  ],
  columns: { start: 30, end: 60 },
})
```

- The alignment says which residues correspond: each other row's CA atoms fit
  the first row's where both rows have one, in `columns` when given
- `matrices` moves each structure into the reference's frame, for the panel's
  `transforms`, and each fit reports its RMSD and the CA pairs it used
- `distanceValues` is the mean CA distance per residue of the reference row
  after the fit, which is a `columnTracks` bar's `values`
- Fitting a pocket and reading the distances elsewhere shows where the rest of
  the fold departs from it
- Structure files are read as mmCIF, and the first model's `ATOM` CA records
  count

## Show the structure

```tsx
import { StructurePanel } from 'react-msaview-structure/panel'
;<StructurePanel model={model} structureId="AF-P04637-F1" colorBy="scheme" />
```

- Hovering the alignment lights the mapped structure residue, and hovering the
  structure lights its cell
- Clicking either side focuses the other
- `colorBy` paints the structure with `conservation`, or with the alignment's
  own `scheme`
- `structureIds` shows several structures, each in its own color unless
  `colorBy` is set, and `transforms` places them
- `molstar` is a peer dependency, and the panel loads it on first mount
