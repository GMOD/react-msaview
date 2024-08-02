import React from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'
import { observer } from 'mobx-react'
import {
  Attributes,
  BaseCard,
} from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'

// locals
import type { MsaViewModel } from '../../../model'
import SequenceTextArea from '../../SequenceTextArea'

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
  const { treeMetadata, rows } = model
  const metadata = treeMetadata[nodeName]
  const [name, sequence] = rows.find(f => f[0] === nodeName)!
  return (
    <Dialog onClose={() => onClose()} open title="Tree node info" maxWidth="xl">
      <DialogContent>
        <BaseCard title="Attributes">
          <Attributes attributes={{ nodeName, ...info }} />
        </BaseCard>
        <BaseCard title="Sequence">
          <SequenceTextArea str={[[name, sequence]]} />
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
