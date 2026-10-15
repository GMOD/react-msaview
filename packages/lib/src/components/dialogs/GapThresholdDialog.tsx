import React from 'react'

import { Dialog } from '@jbrowse/core/ui'
import { Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { observer } from 'mobx-react'

import GappynessSlider from './GappynessSlider.tsx'

import type { MsaViewModel } from '../../model.ts'

const GapThresholdDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  return (
    <Dialog open onClose={onClose} title="Hide gappy columns">
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The viewer hides each column where at least this share of the rows has
          a gap.
        </Typography>
        <GappynessSlider model={model} />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default GapThresholdDialog
