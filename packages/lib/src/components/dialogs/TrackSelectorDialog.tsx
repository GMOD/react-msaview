import React, { useState } from 'react'

import { Dialog } from '@jbrowse/core/ui'
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model.ts'
import type { BasicTrack } from '../../types.ts'

// the tracks in the order the selector lists them, under a heading each
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

const TrackSelectorDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
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
    <Dialog open onClose={onClose} title="Tracks" maxWidth="sm" fullWidth>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {shown.size} of {model.tracks.length} shown
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', my: 1 }}>
          <TextField
            size="small"
            placeholder="Filter tracks"
            value={filter}
            autoFocus
            onChange={event => {
              setFilter(event.target.value)
            }}
            sx={{ flex: 1 }}
          />
          <Button
            onClick={() => {
              model.setTracksShown(matching, true)
            }}
          >
            Show all
          </Button>
          <Button
            onClick={() => {
              model.setTracksShown(matching, false)
            }}
          >
            Hide all
          </Button>
        </Box>
        {groups.map(({ title, tracks }) => (
          <Box key={title} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">{title}</Typography>
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
                  />
                }
                label={name}
              />
            ))}
          </Box>
        ))}
        {groups.length === 0 ? (
          <Typography sx={{ mt: 1 }}>No track matches</Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default TrackSelectorDialog
