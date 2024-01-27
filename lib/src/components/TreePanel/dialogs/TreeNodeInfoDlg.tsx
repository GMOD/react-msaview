import React from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import {
  Attributes,
  BaseCard,
} from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'
import { MsaViewModel } from '../../../model'

export default observer(function ({
  info,
  model,
  nodeName,
  onClose,
}: {
  info: Record<string, unknown>
  model: MsaViewModel
  nodeName: string
  onClose: () => void
}) {
  const { treeMetadata } = model
  const metadata = treeMetadata[nodeName]
  return (
    <Dialog onClose={() => onClose()} open title="Tree node info">
      <DialogContent>
        <BaseCard title="Attributes">
          <Attributes attributes={{ nodeName, ...info }} />
        </BaseCard>
        {metadata ? (
          <BaseCard title="Extra metadata">
            <Attributes attributes={metadata} />
          </BaseCard>
        ) : null}
      </DialogContent>
    </Dialog>
  )
})
