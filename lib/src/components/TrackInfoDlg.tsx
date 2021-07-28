import React, { useState } from 'react'
import copy from 'copy-to-clipboard'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  TextField,
  makeStyles,
} from '@material-ui/core'

const useStyles = makeStyles(() => ({
  textAreaFont: {
    fontFamily: 'Courier New',
    wordBreak: 'break-all',
  },
}))

const TrackInfoDialog = observer(
  ({ model, onClose }: { model: any; onClose: () => void }) => {
    const classes = useStyles()
    const [label, setLabel] = useState('Copy to clipboard')
    return (
      <Dialog open onClose={onClose} fullWidth>
        <DialogTitle>Track info - {model.name}</DialogTitle>

        <DialogContent>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              copy(model.data)
              setLabel('Copied!')
              setTimeout(() => {
                setLabel('Copy to clipboard')
              }, 300)
            }}
          >
            {label}
          </Button>
          <TextField
            multiline
            defaultValue={model.data}
            variant="filled"
            fullWidth
            InputProps={{
              readOnly: true,
              classes: {
                input: classes.textAreaFont,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  },
)

export default TrackInfoDialog
