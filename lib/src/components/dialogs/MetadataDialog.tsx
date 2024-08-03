import React from 'react'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import {
  Attributes,
  BaseCard,
} from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

// locals
import type { MsaViewModel } from '../../model'
import SequenceTextArea from '../SequenceTextArea'

const MetadataDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const { header } = model

  return (
    <Dialog onClose={() => onClose()} open title="Metadata" maxWidth="xl">
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
