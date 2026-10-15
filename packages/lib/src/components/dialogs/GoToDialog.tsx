import React from 'react'

import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'

import GoToBox from './GoToBox.tsx'

import type { MsaViewModel } from '../../model.ts'

export default function GoToDialog({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="Go to row or column"
      maxWidth="xs"
      fullWidth
    >
      <DialogContent>
        <GoToBox model={model} onFound={onClose} />
      </DialogContent>
    </Dialog>
  )
}
