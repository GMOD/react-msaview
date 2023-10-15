import React from 'react'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import { Attributes } from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

// locals
import { MsaViewModel } from '../../model'

const MetadataDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const {
    header,
    data: { treeMetadata },
  } = model
  console.log({ header, treeMetadata })

  return (
    <Dialog onClose={() => onClose()} open title="Metadata">
      <DialogContent>
        <Attributes attributes={header} />
      </DialogContent>
    </Dialog>
  )
})

export default MetadataDialog
