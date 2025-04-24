import React from 'react'

import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model'

const TracklistDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const { tracks } = model

  return (
    <Dialog
      onClose={() => {
        onClose()
      }}
      open
      title="Add track"
    >
      <DialogContent>
        <Typography>
          Open relevant per-alignment tracks e.g. protein domains
        </Typography>

        <FormGroup>
          {tracks.map(track => {
            return (
              <FormControlLabel
                key={track.model.id}
                control={
                  <Checkbox
                    checked={!model.turnedOffTracks.has(track.model.id)}
                    onChange={() => {
                      model.toggleTrack(track.model.id)
                    }}
                  />
                }
                label={track.model.name}
              />
            )
          })}
        </FormGroup>
        <DialogActions>
          <Button
            onClick={() => {
              onClose()
            }}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
})

export default TracklistDialog
