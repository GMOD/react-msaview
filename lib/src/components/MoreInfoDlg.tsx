import React from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import { Attributes } from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

export default observer(function ({
  info,
  onClose,
}: {
  info: any
  onClose: () => void
}) {
  return (
    <Dialog onClose={() => onClose()} open title="Metadata">
      <DialogContent>
        <Attributes attributes={info} />
      </DialogContent>
    </Dialog>
  )
})
