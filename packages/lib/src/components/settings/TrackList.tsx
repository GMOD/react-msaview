import React, { useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model.ts'

interface Entry {
  key: string
  label: string
  ids: string[]
}

export function trackGroups(model: MsaViewModel) {
  const computed = new Set(model.computedTrackModels.map(t => t.model.id))
  const computedEntries: Entry[] = []
  const alignmentEntries: Entry[] = []
  for (const { model: t } of model.tracks) {
    ;(computed.has(t.id) ? computedEntries : alignmentEntries).push({
      key: t.id,
      label: t.name,
      ids: [t.id],
    })
  }
  return [
    { title: 'Computed from the alignment', entries: computedEntries },
    { title: 'Alignment annotations', entries: alignmentEntries },
  ].filter(g => g.entries.length > 0)
}

// a filter box shows once the list is long enough to need one
const filterFrom = 10

const TrackList = observer(function ({ model }: { model: MsaViewModel }) {
  const [filter, setFilter] = useState('')
  const shown = new Set(model.turnedOnTracks.map(t => t.model.id))
  const all = trackGroups(model)
  const needle = filter.trim().toLowerCase()
  const groups = all
    .map(g => ({
      ...g,
      entries: g.entries.filter(e => e.label.toLowerCase().includes(needle)),
    }))
    .filter(g => g.entries.length > 0)
  const matching = groups.flatMap(g => g.entries.flatMap(e => e.ids))
  const long = all.reduce((n, g) => n + g.entries.length, 0) >= filterFrom
  return (
    <>
      {long ? (
        <>
          <TextField
            size="small"
            placeholder="Filter tracks"
            value={filter}
            onChange={event => {
              setFilter(event.target.value)
            }}
            fullWidth
          />
          <Box sx={{ display: 'flex' }}>
            <Button
              size="small"
              onClick={() => {
                model.setTracksShown(matching, true)
              }}
            >
              Show all
            </Button>
            <Button
              size="small"
              onClick={() => {
                model.setTracksShown(matching, false)
              }}
            >
              Hide all
            </Button>
          </Box>
        </>
      ) : null}
      {groups.map(({ title, entries }) => (
        <Box key={title}>
          {groups.length > 1 ? (
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
          ) : null}
          {entries.map(({ key, label, ids }) => {
            const on = ids.filter(id => shown.has(id)).length
            return (
              <FormControlLabel
                key={key}
                sx={{ display: 'flex' }}
                control={
                  <Checkbox
                    size="small"
                    checked={on === ids.length}
                    indeterminate={on > 0 && on < ids.length}
                    onChange={() => {
                      model.setTracksShown(ids, on < ids.length)
                    }}
                    sx={{ py: 0.25 }}
                  />
                }
                label={label}
                slotProps={{ typography: { variant: 'body2' } }}
              />
            )
          })}
        </Box>
      ))}
      {groups.length === 0 ? (
        <Typography variant="body2">No track matches</Typography>
      ) : null}
    </>
  )
})

export default TrackList
