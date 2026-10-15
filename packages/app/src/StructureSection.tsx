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
import { accessionOfRowName, findStructures } from 'react-msaview-structure'

import type { MsaViewModel } from 'react-msaview'
import type { StructureSearch } from 'react-msaview-structure'
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
  | { state: 'done'; result: StructureSearch }
  | { state: 'error'; message: string }

function keyOf(m: { row: string; structure: { id: string; asymId?: string } }) {
  return `${m.row}\u0000${m.structure.id}\u0000${m.structure.asymId ?? ''}`
}

const StructureSection = observer(function StructureSection({
  model,
}: {
  model: MsaViewModel
}) {
  const names = [...model.rowMap.keys()]
  const [chosen, setChosen] = useState<string | null>(null)
  const [accession, setAccession] = useState('')
  const [search, setSearch] = useState<Search>({ state: 'idle' })
  const [shown, setShown] = useState<string>()
  const [colorBy, setColorBy] = useState<StructureColor>('none')
  const abort = useRef<AbortController | undefined>(undefined)

  if (names.length === 0) {
    return null
  }
  const row =
    chosen ??
    model.clickedCell?.row ??
    names.find(n => accessionOfRowName(n)) ??
    names[0]!
  const mapped = [...new Set(model.mappedStructures.map(m => m.structure.id))]
  const structureId = shown && mapped.includes(shown) ? shown : mapped[0]

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
      })
      if (!controller.signal.aborted) {
        setSearch({ state: 'done', result })
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

  function show(candidate: StructureSearch['candidates'][number]) {
    const { mapping } = candidate
    model.setResidueMappings([
      ...model.residueMappings.filter(m => keyOf(m) !== keyOf(mapping)),
      mapping,
    ])
    setShown(mapping.structure.id)
  }

  return (
    <Box
      data-testid="structure"
      sx={{ border: 1, borderColor: 'divider', m: 2.5, p: 1.5 }}
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
      {search.state === 'done' && search.result.problem ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {search.result.problem}
        </Alert>
      ) : null}
      {search.state === 'done' && search.result.candidates.length > 0 ? (
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

      {structureId ? (
        <Box sx={{ mt: 1.5 }}>
          <Suspense fallback={<Box sx={{ height: 400 }} />}>
            <StructurePanel
              model={model}
              structureId={structureId}
              colorBy={colorBy}
            />
          </Suspense>
        </Box>
      ) : null}
    </Box>
  )
})

export default StructureSection
