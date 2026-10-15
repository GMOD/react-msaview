import { useEffect, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { observer } from 'mobx-react'
import { MSAModelF, MSAView } from 'react-msaview'
import { facetsByRowField, superposeRows } from 'react-msaview-structure'
import { FacetGrid } from 'react-msaview-structure/panel'

import alignments from './structureAlignments.json'
import { useAccessionMappings } from './structureDemo'
import useWidthSetter from './useWidthSetter'

import type { SuperposeRowsResult } from 'react-msaview-structure'
import type { StructureColor } from 'react-msaview-structure/panel'

const { kinases } = alignments
const landmarks = kinases.landmarks

const marks = [
  { name: 'Gly-rich loop (GxGxxG)', color: '#e41a1c' },
  { name: 'catalytic Lys', color: '#ff7f00' },
  { name: 'HRD motif', color: '#ff00aa' },
  { name: 'DFG motif', color: '#ffd400' },
] as const

const groupColors = {
  CMGC: '#0072b2',
  AGC: '#009e73',
  CAMK: '#7a5195',
  Other: '#6c757d',
}

// Eight human kinases from four of the kinome's groups, one panel per group.
// The alignment decides which residues sit on which, so all eight structures
// lie in one frame and the four panels turn together: whatever differs
// between groups differs in place. The four colored marks are the motifs every
// protein kinase carries, on the alignment and on each structure.
const KinaseFacets = observer(function KinaseFacets() {
  const [model] = useState(() => {
    const created = MSAModelF().create({
      type: 'MsaView',
      height: 300,
      colorSchemeName: 'clustalx_protein_dynamic',
      data: { msa: kinases.msa },
      highlights: marks.map(({ name, color }) => ({
        start: landmarks[name].column,
        end: landmarks[name].column,
        label: name.replace(/ \(.*\)/, ''),
        color,
      })),
    })
    created.setRowData(
      Object.fromEntries(
        kinases.proteins.map(({ row, group }) => [row, { group }]),
      ),
    )
    return created
  })
  const ref = useWidthSetter(model)
  const mappings = useAccessionMappings(model, kinases.proteins)
  const [fit, setFit] = useState<SuperposeRowsResult>()
  const [error, setError] = useState<string>()
  const [colorBy, setColorBy] = useState<StructureColor>('none')

  const ready = mappings.state === 'ready'
  const targets = kinases.proteins.flatMap(({ row }) => {
    const mapped = model.mappedStructures.find(m => m.row === row)
    return mapped ? [{ row, structureId: mapped.structure.id }] : []
  })
  const targetsRef = useRef(targets)
  targetsRef.current = targets

  useEffect(() => {
    if (!ready) {
      return
    }
    superposeRows({ model, targets: targetsRef.current })
      .then(setFit)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e))
      })
  }, [ready, model])

  const facets = ready ? facetsByRowField(model, 'group', groupColors) : []
  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: 'center' }}>
        <Typography variant="body2">Color the structures by</Typography>
        <Select
          size="small"
          value={colorBy}
          onChange={e => {
            setColorBy(e.target.value)
          }}
        >
          <MenuItem value="none">Kinase group</MenuItem>
          <MenuItem value="conservation">Column conservation</MenuItem>
          <MenuItem value="scheme">Alignment colors</MenuItem>
        </Select>
      </Stack>
      {mappings.state === 'loading' ? (
        <Typography variant="body2">{mappings.message}…</Typography>
      ) : null}
      {mappings.state === 'error' ? (
        <Alert severity="warning">{mappings.message}</Alert>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {fit ? (
        <Alert severity="info" sx={{ mb: 1 }}>
          Fitted on every column the alignment shares with {fit.referenceId}:{' '}
          {fit.fits
            .map(
              f =>
                `${f.row} ${f.rmsd.toFixed(1)} Å over ${f.fitted} of ${f.considered}`,
            )
            .join(' · ')}
        </Alert>
      ) : null}
      <div ref={ref} style={{ marginBottom: 12 }}>
        <MSAView model={model} />
      </div>
      {facets.length > 0 ? (
        <FacetGrid
          model={model}
          facets={facets}
          transforms={fit?.matrices}
          columns={4}
          cellHeight={260}
          colorBy={colorBy}
        />
      ) : null}
    </Box>
  )
})

export default KinaseFacets
