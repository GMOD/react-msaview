import React, { useState } from 'react'
import copy from 'copy-to-clipboard'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  makeStyles,
} from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  textArea: {
    padding: theme.spacing(2),
    overflow: 'auto',
    background: '#ddd',
    wordBreak: 'break-word',
  },
}))

const TrackInfoDialog = observer(
  ({ model, onClose }: { model: any; onClose: () => void }) => {
    const [label, setLabel] = useState('Copy to clipboard')
    const classes = useStyles()
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="lg">
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
          <pre className={classes.textArea}>{model.data}</pre>
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
