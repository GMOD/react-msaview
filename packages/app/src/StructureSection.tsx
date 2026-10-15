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
import { alpha } from '@mui/material/styles'
import { observer } from 'mobx-react'
import {
  FOLDSEEK_MAX_RESIDUES,
  accessionOfRowName,
  canFindStructures,
  findStructures,
  foldseekCandidates,
  foldseekQuery,
  identifiersOfRowName,
  networkLookups,
  searchFoldseek,
  superposeRows,
} from 'react-msaview-structure'

import type { SxProps, Theme } from '@mui/material'
import type { MsaViewModel } from 'react-msaview'
import type {
  StructureCandidate,
  StructureSearch,
  SuperposeRowsResult,
} from 'react-msaview-structure'
import type { StructureColor, TmAlignment } from 'react-msaview-structure/panel'

// Mol* is a large chunk, so it loads when a structure first shows
const StructurePanel = lazy(() =>
  import('react-msaview-structure/panel').then(m => ({
    default: m.StructurePanel,
  })),
)

type FoldseekState =
  | { state: 'idle' }
  | { state: 'running'; row: string; message: string }
  | { state: 'done'; row: string; candidates: StructureCandidate[] }
  | { state: 'error'; row: string; message: string }

type Search =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; result: StructureSearch; row: string }
  | { state: 'error'; row: string; message: string }

function messageOf(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function signalledFetchText(signal: AbortSignal) {
  return async (url: string) => {
    const res = await fetch(url, { signal })
    if (!res.ok) {
      throw new Error(`${url}: HTTP ${res.status}`)
    }
    return res.text()
  }
}

function keyOf(m: { row: string; structure: { id: string; asymId?: string } }) {
  return `${m.row}\u0000${m.structure.id}\u0000${m.structure.asymId ?? ''}`
}

const distanceTrackId = 'structure-ca-distance'
const maxSuperposedRows = 12

type Superposition =
  | { state: 'idle' }
  | { state: 'working'; message: string }
  | {
      state: 'done'
      result: SuperposeRowsResult
      problems: string[]
      reference: string
    }
  | { state: 'tm'; ids: string[]; fits?: Record<string, TmAlignment> }
  | { state: 'error'; message: string }

function CandidateButton({
  candidate,
  selected,
  color,
  title,
  onClick,
}: {
  candidate: StructureCandidate
  selected: boolean
  color: 'primary' | 'secondary'
  title: string
  onClick: () => void
}) {
  return (
    <Button
      size="small"
      variant="outlined"
      color={color}
      aria-pressed={selected}
      title={title}
      onClick={onClick}
      sx={
        selected
          ? {
              borderWidth: 2,
              fontWeight: 700,
              bgcolor: theme => alpha(theme.palette[color].main, 0.12),
            }
          : undefined
      }
    >
      {candidate.label}
    </Button>
  )
}

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
  const searchAbort = useRef<AbortController | undefined>(undefined)
  const foldseekAbort = useRef<AbortController | undefined>(undefined)
  const superposeAbort = useRef<AbortController | undefined>(undefined)
  const [foldseek, setFoldseek] = useState<FoldseekState>({ state: 'idle' })
  const [fitBy, setFitBy] = useState<'alignment' | 'tm-align'>('alignment')
  const [superposition, setSuperposition] = useState<Superposition>({
    state: 'idle',
  })

  if (names.length === 0) {
    return null
  }
  const row =
    (chosen && model.rowMap.has(chosen) ? chosen : undefined) ??
    model.clickedCell?.row ??
    names.find(n => canFindStructures(n)) ??
    names[0]!
  const mapped = [...new Set(model.mappedStructures.map(m => m.structure.id))]
  const structureId = shown && mapped.includes(shown) ? shown : mapped[0]
  const superposed =
    superposition.state === 'done' ? superposition.result : undefined
  const shownIds = superposed
    ? [superposed.referenceId, ...Object.keys(superposed.matrices)]
    : superposition.state === 'tm'
      ? superposition.ids
      : structureId
        ? [structureId]
        : []
  const withAccession = names.filter(n => canFindStructures(n))
  const typed = accession.trim()
  const rowKind: 'typed' | 'accession' | 'name' | 'none' = typed
    ? 'typed'
    : accessionOfRowName(row)
      ? 'accession'
      : identifiersOfRowName(row).length > 0
        ? 'name'
        : 'none'
  const noId = rowKind === 'none'
  const lookupFailed =
    search.state === 'done' && search.row === row && !!search.result.problem
  const showAccession = noId || lookupFailed || typed !== ''

  function restart(ref: typeof searchAbort) {
    ref.current?.abort()
    const controller = new AbortController()
    ref.current = controller
    return controller
  }

  async function find() {
    const controller = restart(searchAbort)
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
        setSearch({ state: 'error', row, message: messageOf(e) })
      }
    }
  }

  async function searchFold() {
    const rowSequence = model.rowSequence(row) ?? ''
    const { sequence } = foldseekQuery(rowSequence)
    if (sequence.length > FOLDSEEK_MAX_RESIDUES) {
      setFoldseek({
        state: 'error',
        row,
        message: `Foldseek's 3Di predictor takes at most ${FOLDSEEK_MAX_RESIDUES} residues and ${row} has ${sequence.length}.`,
      })
      return
    }
    if (sequence.length < 20) {
      setFoldseek({
        state: 'error',
        row,
        message: `${row} has ${sequence.length} standard residues, too few to search with.`,
      })
      return
    }
    const controller = restart(foldseekAbort)
    setFoldseek({ state: 'running', row, message: 'Starting' })
    try {
      const hits = await searchFoldseek(sequence, {
        signal: controller.signal,
        onStatus: message => {
          if (!controller.signal.aborted) {
            setFoldseek({ state: 'running', row, message })
          }
        },
      })
      const candidates = await foldseekCandidates({
        rowName: row,
        rowSequence,
        hits,
        fetchText: signalledFetchText(controller.signal),
      })
      if (!controller.signal.aborted) {
        setFoldseek({ state: 'done', row, candidates })
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setFoldseek({ state: 'error', row, message: messageOf(e) })
      }
    }
  }

  async function superposeAll() {
    const { signal } = restart(superposeAbort)
    const working = (message: string) => {
      if (!signal.aborted) {
        setSuperposition({ state: 'working', message })
      }
    }
    try {
      const picked = model.selection?.rows?.filter(r =>
        withAccession.includes(r),
      )
      const pool = picked && picked.length > 1 ? picked : withAccession
      const rows = pool.slice(0, maxSuperposedRows)
      const mappedRows = () => new Set(model.mappedStructures.map(m => m.row))
      const before = mappedRows()
      const missing = rows.filter(r => !before.has(r))
      const problems: string[] = []
      let finished = 0
      working(`Finding structures for ${missing.length} rows`)
      const found = await Promise.all(
        missing.map(async rowName => {
          try {
            const result = await findStructures({
              rowName,
              rowSequence: model.rowSequence(rowName) ?? '',
              lookups: networkLookups(signal),
            })
            const first = result.candidates[0]
            if (!first && result.problem) {
              problems.push(result.problem)
            }
            return first?.mapping
          } catch (e) {
            problems.push(`${rowName}: ${messageOf(e)}`)
            return undefined
          } finally {
            finished += 1
            working(`Finding structures ${finished} of ${missing.length}`)
          }
        }),
      )
      if (signal.aborted) {
        return
      }
      const have = mappedRows()
      model.setResidueMappings([
        ...model.residueMappings,
        ...found.flatMap(m => (m && !have.has(m.row) ? [m] : [])),
      ])
      if (pool.length > rows.length) {
        problems.push(
          `fitted the first ${maxSuperposedRows} of ${pool.length} rows with an id`,
        )
      }
      const targets = rows.flatMap(rowName => {
        const m = model.mappedStructures.find(x => x.row === rowName)
        return m ? [{ row: rowName, structureId: m.structure.id }] : []
      })
      if (fitBy === 'tm-align') {
        const ids = [...new Set(targets.map(t => t.structureId))]
        if (ids.length < 2) {
          throw new Error('TM-align needs structures for at least two rows')
        }
        setSuperposition({ state: 'tm', ids })
        return
      }
      working('Fitting')
      const { selection } = model
      const result = await superposeRows({
        model,
        targets,
        columns: selection
          ? { start: selection.start - 1, end: selection.end - 1 }
          : undefined,
        fetchText: signalledFetchText(signal),
      })
      if (signal.aborted) {
        return
      }
      const max = Math.ceil(
        Math.max(1, ...result.distanceValues.filter(Number.isFinite)),
      )
      model.setColumnTracks([
        ...model.columnTracks.filter(t => t.id !== distanceTrackId),
        {
          id: distanceTrackId,
          name: `CA distance to ${targets[0]!.row} (0–${max} Å)`,
          kind: 'bar',
          row: targets[0]!.row,
          values: result.distanceValues,
          max,
          color: '#d55e00',
          height: 60,
        },
      ])
      setSuperposition({
        state: 'done',
        result,
        problems,
        reference: targets[0]!.row,
      })
    } catch (e) {
      if (!signal.aborted) {
        setSuperposition({ state: 'error', message: messageOf(e) })
      }
    }
  }

  function clearSuperposition() {
    superposeAbort.current?.abort()
    model.setColumnTracks(
      model.columnTracks.filter(t => t.id !== distanceTrackId),
    )
    setSuperposition({ state: 'idle' })
  }

  function show(candidate: StructureSearch['candidates'][number]) {
    const { mapping } = candidate
    if (superposition.state !== 'idle') {
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
            searchAbort.current?.abort()
            setChosen(value)
            setSearch({ state: 'idle' })
          }}
          renderInput={params => <TextField {...params} label="Row" />}
        />
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

      {noId ? (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {row} is not a database id. Type a UniProt accession, or search by
          sequence for similar folds.
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          mt: 1,
        }}
      >
        <Button
          variant="contained"
          size="small"
          disabled={search.state === 'loading' || (noId && !typed)}
          title="Looks the id up in UniProt, then finds the AlphaFold DB model and the PDB entries"
          onClick={() => {
            void find()
          }}
        >
          Find structure
        </Button>
        {showAccession ? (
          <TextField
            size="small"
            label="UniProt accession"
            placeholder={accessionOfRowName(row) ?? 'P04637'}
            value={accession}
            onChange={e => {
              setAccession(e.target.value)
            }}
            sx={{ width: 170 }}
          />
        ) : null}
        {noId ? (
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            disabled={foldseek.state === 'running'}
            title={`Sends ${row}'s sequence to search.foldseek.com and waits for their queue. Finds proteins that fold like it, which need not be the same protein.`}
            onClick={() => {
              void searchFold()
            }}
          >
            Search by sequence (Foldseek)
          </Button>
        ) : null}
        {withAccession.length > 1 ? (
          <>
            <Select
              size="small"
              value={fitBy}
              onChange={e => {
                setFitBy(e.target.value)
              }}
              title="What the fit uses"
            >
              <MenuItem value="alignment">Fit by alignment</MenuItem>
              <MenuItem value="tm-align">Fit by structure (TM-align)</MenuItem>
            </Select>
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
            {superposition.state === 'done' ||
            superposition.state === 'tm' ||
            model.columnTracks.some(t => t.id === distanceTrackId) ? (
              <Button size="small" color="inherit" onClick={clearSuperposition}>
                Clear
              </Button>
            ) : null}
          </>
        ) : null}
        {search.state === 'loading' ? <CircularProgress size={20} /> : null}
        {foldseek.state === 'running' ? (
          <Typography variant="body2">
            {foldseek.row}: {foldseek.message}…
          </Typography>
        ) : null}
        {superposition.state === 'working' ? (
          <Typography variant="body2">{superposition.message}…</Typography>
        ) : null}
      </Box>

      {foldseek.state === 'error' ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {foldseek.message}
        </Alert>
      ) : null}
      {foldseek.state === 'done' ? (
        foldseek.candidates.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption">
              Foldseek hits for {foldseek.row}: structural homologs, so a
              mapping is the alignment Foldseek made and not the same protein
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {foldseek.candidates.map(candidate => (
                <CandidateButton
                  key={keyOf(candidate.mapping)}
                  candidate={candidate}
                  selected={candidate.mapping.structure.id === structureId}
                  color="secondary"
                  title={`${candidate.mapping.row}: ${candidate.identity}`}
                  onClick={() => {
                    show(candidate)
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Foldseek found no hit it could map {foldseek.row} onto.
          </Alert>
        )
      ) : null}
      {search.state === 'error' && search.row === row ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {search.message}
        </Alert>
      ) : null}
      {search.state === 'done' &&
      search.row === row &&
      search.result.problem ? (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          action={
            <Button
              color="secondary"
              size="small"
              disabled={foldseek.state === 'running'}
              onClick={() => {
                void searchFold()
              }}
            >
              Search by sequence
            </Button>
          }
        >
          {search.result.problem}
        </Alert>
      ) : null}
      {search.state === 'done' &&
      search.row === row &&
      search.result.candidates.length > 0 ? (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {search.result.candidates.map(candidate => (
            <CandidateButton
              key={keyOf(candidate.mapping)}
              candidate={candidate}
              selected={candidate.mapping.structure.id === structureId}
              color="primary"
              title={`${candidate.mapping.row} matches ${search.result.accession} at ${candidate.identity}`}
              onClick={() => {
                show(candidate)
              }}
            />
          ))}
        </Box>
      ) : null}

      {superposition.state === 'error' ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {superposition.message}
        </Alert>
      ) : null}
      {superposition.state === 'tm' ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          {superposition.fits
            ? Object.entries(superposition.fits)
                .map(
                  ([id, f]) =>
                    `${id}: TM-score ${f.tmScore.toFixed(2)}, ${f.rmsd.toFixed(2)} Å over ${f.alignedLength} residues`,
                )
                .join(' · ')
            : 'Aligning by structure'}
        </Alert>
      ) : null}
      {superposed ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          {superposed.fits
            .map(
              f =>
                `${f.row}: ${f.rmsd.toFixed(2)} Å over ${f.fitted} of ${f.considered} aligned CA pairs`,
            )
            .join(' · ')}
          {superposed.skipped.length > 0
            ? ` · skipped ${superposed.skipped.map(k => `${k.row} (${k.reason})`).join('; ')}`
            : ''}
          {superposition.state === 'done' && superposition.problems.length > 0
            ? ` · ${superposition.problems.join('; ')}`
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
              fitBy={superposition.state === 'tm' ? 'tm-align' : 'transforms'}
              onTmAlign={fits => {
                setSuperposition(prev =>
                  prev.state === 'tm' ? { ...prev, fits } : prev,
                )
              }}
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
