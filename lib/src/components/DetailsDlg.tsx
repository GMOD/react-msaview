import React from 'react'
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core'
import { observer } from 'mobx-react'
import { Attributes } from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'
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
    const { alignmentDetails } = model

    return (
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>Metadata</DialogTitle>
        <DialogContent>
          <Attributes attributes={alignmentDetails} />
        </DialogContent>
      </Dialog>
    )
  },
)
