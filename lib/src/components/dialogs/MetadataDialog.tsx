import React from 'react'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import {
  Attributes,
  BaseCard,
} from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

// locals
import { MsaViewModel } from '../../model'
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
          <SequenceTextArea
            str={model.rows.map(r => `>${r[0]}\n${r[1]}`).join('\n')}
          />
        </BaseCard>
      </DialogContent>
    </Dialog>
  )
})

export default MetadataDialog
