import React from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Typography,
} from '@material-ui/core'

import { MsaViewModel } from '../model'

export default observer(
  ({
    onClose,
    data,
    model,
  }: {
    model: MsaViewModel
    onClose: () => void
    data: { left: number; right: number }
  }) => {
    const { left, right } = data
    return (
      <Dialog onClose={() => onClose()} open>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to add an annotation to the MSA at {left}..{right} (real
            position {model.getRealPos(left)}..{model.getRealPos(right)})
          </Typography>

          <DialogActions>
            <Button
              onClick={() => {
                model.addAnnotation(left, right)
                onClose()
              }}
              variant="contained"
              color="primary"
            >
              Submit
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  },
)
