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
            {tracks.map(track => {
              console.log({ m: track.model })
              return (
                <FormControlLabel
                  key={track.model.id}
                  control={
                    <Checkbox
                      checked={!model.turnedOffTracks.has(model.id)}
                      onChange={() => {
                        model.toggleTrack(model)
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
