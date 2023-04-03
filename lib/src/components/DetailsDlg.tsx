import React from 'react'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import { Attributes } from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

// locals
import { MsaViewModel } from '../model'

export default observer(function ({
  model,
  onClose,
  open,
}: {
  model: MsaViewModel
  onClose: () => void
  open: boolean
}) {
  const { alignmentDetails } = model

  return (
    <Dialog onClose={() => onClose()} open={open} title="Metadata">
      <DialogContent>
        <Attributes attributes={alignmentDetails} />
      </DialogContent>
    </Dialog>
  )
})
