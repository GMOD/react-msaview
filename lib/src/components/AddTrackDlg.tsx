import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
} from '@material-ui/core'
import { FileSelector } from '@jbrowse/core/ui'
import { FileLocation } from '@jbrowse/core/util/types'
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
    const options = model.rows.map(r => r[0])
    const [trackFile, setTrackFile] = useState<FileLocation>()
    const [currentOption, setCurrentOption] = useState('')

    return (
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>Add track</DialogTitle>
        <DialogContent>
          <Typography>
            Open relevant per-alignment tracks e.g. protein domains
          </Typography>
          <TextField
            select
            helperText="Which row does this track apply to?"
            value={currentOption}
            onChange={event => {
              setCurrentOption(event.target.value)
            }}
          >
            {options.map((option, index) => (
              <MenuItem key={`${option}-${index}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <FileSelector location={trackFile} setLocation={setTrackFile} />
          <DialogActions>
            <Button
              onClick={() => {
                model.setError(undefined)
                if (trackFile) {
                  model.setMSAFilehandle(trackFile)
                }
              }}
              variant="contained"
              color="primary"
            >
              Open
            </Button>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  },
)
