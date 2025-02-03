import React from 'react'

import Attributes from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail/Attributes'
import BaseCard from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail/BaseCard'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'


// locals
import SequenceTextArea from '../SequenceTextArea'

import type { MsaViewModel } from '../../model'

const MetadataDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const { header } = model

  return (
    <Dialog
      onClose={() => {
        onClose()
      }}
      open
      title="Metadata"
      maxWidth="xl"
    >
      <DialogContent>
        <Attributes attributes={header} />
        <BaseCard title="sequence">
          <SequenceTextArea str={model.rows} />
        </BaseCard>
      </DialogContent>
    </Dialog>
  )
})

export default MetadataDialog
