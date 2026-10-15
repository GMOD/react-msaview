import { Suspense, lazy, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'
import {
  accessionOfRowName,
  canFindStructures,
  findStructures,
  networkLookups,
  superposeRows,
} from 'react-msaview-structure'

import type { SxProps, Theme } from '@mui/material'
import type { MsaViewModel } from 'react-msaview'
import type {
  StructureSearch,
  SuperposeRowsResult,
} from 'react-msaview-structure'
import type { StructureColor } from 'react-msaview-structure/panel'

// Mol* is a large chunk, so it loads when a structure first shows
const StructurePanel = lazy(() =>
  import('react-msaview-structure/panel').then(m => ({
    default: m.StructurePanel,
  })),
)

type Search =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; result: StructureSearch; row: string }
  | { state: 'error'; message: string }

function keyOf(m: { row: string; structure: { id: string; asymId?: string } }) {
  return `${m.row}\u0000${m.structure.id}\u0000${m.structure.asymId ?? ''}`
}

const distanceTrackId = 'structure-ca-distance'

type Superposition =
  | { state: 'idle' }
  | { state: 'working'; message: string }
  | { state: 'done'; result: SuperposeRowsResult; reference: string }
  | { state: 'error'; message: string }

const StructureSection = observer(function StructureSection({
  model,
  panelHeight = 400,
  sx,
}: {
  model: MsaViewModel
  panelHeight?: number
  sx?: SxProps<Theme>
}) {
  const names = [...model.rowMap.keys()]
  const [chosen, setChosen] = useState<string | null>(null)
  const [accession, setAccession] = useState('')
  const [search, setSearch] = useState<Search>({ state: 'idle' })
  const [shown, setShown] = useState<string>()
  const [colorBy, setColorBy] = useState<StructureColor>('none')
  const abort = useRef<AbortController | undefined>(undefined)
  const [superposition, setSuperposition] = useState<Superposition>({
    state: 'idle',
  })

  if (names.length === 0) {
    return null
  }
  const row =
    chosen ??
    model.clickedCell?.row ??
    names.find(n => canFindStructures(n)) ??
    names[0]!
  const mapped = [...new Set(model.mappedStructures.map(m => m.structure.id))]
  const structureId = shown && mapped.includes(shown) ? shown : mapped[0]
  const superposed =
    superposition.state === 'done' ? superposition.result : undefined
  const shownIds = superposed
    ? [superposed.referenceId, ...Object.keys(superposed.matrices)]
    : structureId
      ? [structureId]
      : []
  const withAccession = names.filter(n => canFindStructures(n))

  async function find() {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setSearch({ state: 'loading' })
    try {
      const result = await findStructures({
        rowName: row,
        rowSequence: model.rowSequence(row) ?? '',
        accession: accession.trim() || undefined,
        lookups: networkLookups(controller.signal),
      })
      if (!controller.signal.aborted) {
        setSearch({ state: 'done', result, row })
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setSearch({
          state: 'error',
          message: e instanceof Error ? e.message : String(e),
        })
      }
    }
  }

  async function superposeAll() {
    setSuperposition({ state: 'working', message: 'Finding structures' })
    try {
      const rows = withAccession.slice(0, 12)
      const mappings = [...model.residueMappings]
      const problems: string[] = []
      for (const [i, rowName] of rows.entries()) {
        setSuperposition({
          state: 'working',
          message: `Finding structures ${i + 1} of ${rows.length}`,
        })
        const have = mappings.some(m => m.row === rowName)
        if (have) {
          continue
        }
        try {
          const found = await findStructures({
            rowName,
            rowSequence: model.rowSequence(rowName) ?? '',
          })
          const first = found.candidates[0]
          if (first) {
            mappings.push(first.mapping)
          } else if (found.problem) {
            problems.push(found.problem)
          }
        } catch (e) {
          problems.push(
            `${rowName}: ${e instanceof Error ? e.message : String(e)}`,
          )
        }
      }
      model.setResidueMappings(mappings)
      const targets = rows.flatMap(rowName => {
        const m = mappings.find(x => x.row === rowName)
        return m ? [{ row: rowName, structureId: m.structure.id }] : []
      })
      setSuperposition({ state: 'working', message: 'Fitting' })
      const { selection } = model
      const result = await superposeRows({
        model,
        targets,
        columns: selection
          ? { start: selection.start - 1, end: selection.end - 1 }
          : undefined,
      })
      model.setColumnTracks([
        ...model.columnTracks.filter(t => t.id !== distanceTrackId),
        {
          id: distanceTrackId,
          name: `CA distance to ${targets[0]!.row} (Å)`,
          kind: 'bar',
          row: targets[0]!.row,
          values: result.distanceValues,
          color: '#d55e00',
          height: 60,
        },
      ])
      setSuperposition({
        state: 'done',
        result: {
          ...result,
          skipped: [
            ...problems.map(reason => ({ row: '', reason })),
            ...result.skipped,
          ],
        },
        reference: targets[0]!.row,
      })
    } catch (e) {
      setSuperposition({
        state: 'error',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  function clearSuperposition() {
    model.setColumnTracks(
      model.columnTracks.filter(t => t.id !== distanceTrackId),
    )
    setSuperposition({ state: 'idle' })
  }

  function show(candidate: StructureSearch['candidates'][number]) {
    const { mapping } = candidate
    if (superposition.state === 'done') {
      clearSuperposition()
    }
    model.setResidueMappings([
      ...model.residueMappings.filter(m => keyOf(m) !== keyOf(mapping)),
      mapping,
    ])
    setShown(mapping.structure.id)
  }

  return (
    <Box
      data-testid="structure"
      sx={[
        { border: 1, borderColor: 'divider', m: 2.5, p: 1.5 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600 }}>
          Structure
        </Typography>
        <Autocomplete
          size="small"
          sx={{ width: 260 }}
          options={names}
          value={row}
          disableClearable
          onChange={(_e, value) => {
            abort.current?.abort()
            setChosen(value)
            setSearch({ state: 'idle' })
          }}
          renderInput={params => <TextField {...params} label="Row" />}
        />
        <TextField
          size="small"
          label="UniProt accession"
          placeholder={accessionOfRowName(row) ?? 'P04637'}
          value={accession}
          onChange={e => {
            setAccession(e.target.value)
          }}
          sx={{ width: 190 }}
        />
        <Button
          variant="contained"
          size="small"
          disabled={search.state === 'loading'}
          onClick={() => {
            void find()
          }}
        >
          Find structures
        </Button>
        {search.state === 'loading' ? <CircularProgress size={20} /> : null}
        {mapped.length > 1 ? (
          <Select
            size="small"
            value={structureId ?? ''}
            onChange={e => {
              setShown(e.target.value)
            }}
          >
            {mapped.map(id => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </Select>
        ) : null}
        {withAccession.length > 1 ? (
          <Button
            variant="outlined"
            size="small"
            disabled={superposition.state === 'working'}
            onClick={() => {
              void superposeAll()
            }}
          >
            Superpose rows
          </Button>
        ) : null}
        {superposition.state === 'done' ? (
          <Button size="small" onClick={clearSuperposition}>
            Clear superposition
          </Button>
        ) : null}
        {superposition.state === 'working' ? (
          <Typography variant="body2">{superposition.message}…</Typography>
        ) : null}
        {structureId ? (
          <Select
            size="small"
            value={colorBy}
            onChange={e => {
              setColorBy(e.target.value)
            }}
          >
            <MenuItem value="none">No coloring</MenuItem>
            <MenuItem value="conservation">Column conservation</MenuItem>
            <MenuItem value="scheme">Alignment colors</MenuItem>
          </Select>
        ) : null}
      </Box>

      {search.state === 'error' ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {search.message}
        </Alert>
      ) : null}
      {search.state === 'done' &&
      search.row === row &&
      search.result.problem ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {search.result.problem}
        </Alert>
      ) : null}
      {search.state === 'done' &&
      search.row === row &&
      search.result.candidates.length > 0 ? (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {search.result.candidates.map(candidate => (
            <Button
              key={keyOf(candidate.mapping)}
              size="small"
              variant={
                candidate.mapping.structure.id === structureId
                  ? 'contained'
                  : 'outlined'
              }
              onClick={() => {
                show(candidate)
              }}
              title={`${candidate.mapping.row} matches ${search.result.accession} at ${candidate.identity}`}
            >
              {candidate.label}
            </Button>
          ))}
        </Box>
      ) : null}

      {superposition.state === 'error' ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {superposition.message}
        </Alert>
      ) : null}
      {superposed ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          {superposed.fits
            .map(
              f =>
                `${f.row}: ${f.rmsd.toFixed(2)} Å over ${f.fitted} aligned CA pairs`,
            )
            .join(' · ')}
          {superposed.skipped.length > 0
            ? ` · skipped ${superposed.skipped.map(k => `${k.row || 'a row'} (${k.reason})`).join('; ')}`
            : ''}
        </Alert>
      ) : null}

      {structureId ? (
        <Box sx={{ mt: 1.5 }}>
          <Suspense fallback={<Box sx={{ height: panelHeight }} />}>
            <StructurePanel
              model={model}
              structureIds={shownIds}
              transforms={superposed?.matrices}
              colorBy={colorBy}
              height={panelHeight}
            />
          </Suspense>
        </Box>
      ) : null}
    </Box>
  )
})

export default StructureSection
