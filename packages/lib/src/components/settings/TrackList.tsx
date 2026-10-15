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
import type { BasicTrack } from '../../types.ts'

// the tracks in the order the list shows them, under a heading each
export function trackGroups(model: MsaViewModel) {
  const computed = new Set(model.computedTrackModels.map(t => t.model.id))
  const groups: { title: string; tracks: BasicTrack[] }[] = [
    { title: 'Computed from the alignment', tracks: [] },
    { title: 'Alignment annotations', tracks: [] },
    { title: 'Per-row annotations', tracks: [] },
  ]
  for (const track of model.tracks) {
    const group = computed.has(track.model.id)
      ? 0
      : track.model.associatedRowName
        ? 2
        : 1
    groups[group]!.tracks.push(track)
  }
  return groups.filter(g => g.tracks.length > 0)
}

// a filter box shows once the list is long enough to need one
const filterFrom = 8

const TrackList = observer(function ({ model }: { model: MsaViewModel }) {
  const [filter, setFilter] = useState('')
  const shown = new Set(model.turnedOnTracks.map(t => t.model.id))
  const needle = filter.trim().toLowerCase()
  const groups = trackGroups(model)
    .map(g => ({
      ...g,
      tracks: g.tracks.filter(t => t.model.name.toLowerCase().includes(needle)),
    }))
    .filter(g => g.tracks.length > 0)
  const matching = groups.flatMap(g => g.tracks.map(t => t.model.id))
  return (
    <>
      {model.tracks.length >= filterFrom ? (
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
      {groups.map(({ title, tracks }) => (
        <Box key={title}>
          {groups.length > 1 ? (
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
          ) : null}
          {tracks.map(({ model: { id, name } }) => (
            <FormControlLabel
              key={id}
              sx={{ display: 'flex' }}
              control={
                <Checkbox
                  size="small"
                  checked={shown.has(id)}
                  onChange={() => {
                    model.toggleTrack(id)
                  }}
                  sx={{ py: 0.25 }}
                />
              }
              label={name}
              slotProps={{ typography: { variant: 'body2' } }}
            />
          ))}
        </Box>
      ))}
      {groups.length === 0 ? (
        <Typography variant="body2">No track matches</Typography>
      ) : null}
    </>
  )
})

export default TrackList
