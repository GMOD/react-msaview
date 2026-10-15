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
- AlphaFold DB and RCSB answer the lookups, both from the browser
- The row is aligned once to the entry's canonical sequence, and each
  candidate's `segments` compose that alignment with the structure's own
  numbering (`label_seq_id`)
- A row that does not match its entry gets no candidates and a `problem`
- A generated mapping names its chain by the author id RCSB reports

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
- `molstar` is a peer dependency, and the panel loads it on first mount
