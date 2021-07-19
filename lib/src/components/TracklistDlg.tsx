import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Checkbox,
  DialogActions,
  Button,
  Typography,
} from '@material-ui/core'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

export default observer(
  ({
    model,
    onClose,
    open,
  }: {
    model: MsaViewModel
    onClose: () => void
    open: boolean
  }) => {
    const { tracks } = model

    return (
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>Add track</DialogTitle>
        <DialogContent>
          <Typography>
            Open relevant per-alignment tracks e.g. protein domains
          </Typography>

          <FormGroup>
            {tracks.map(track => (
              <FormControlLabel
                key={track.id}
                control={
                  <Checkbox
                    checked={!model.turnedOffTracks.has(track.id)}
                    onChange={() => {
                      model.toggleTrack(track)
                    }}
                  />
                }
                label={track.name}
              />
            ))}
          </FormGroup>
          <DialogActions>
            <Button
              onClick={() => onClose()}
              variant="contained"
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  },
)
