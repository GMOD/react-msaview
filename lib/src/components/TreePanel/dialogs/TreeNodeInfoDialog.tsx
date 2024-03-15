import React from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent, TextField } from '@mui/material'
import { observer } from 'mobx-react'
import {
  Attributes,
  BaseCard,
} from '@jbrowse/core/BaseFeatureWidget/BaseFeatureDetail'
import { makeStyles } from 'tss-react/mui'

// locals
import { MsaViewModel } from '../../../model'

const useStyles = makeStyles()({
  textAreaFont: {
    fontFamily: 'Courier New',
  },
  dialogContent: {
    background: 'lightgrey',
    margin: 4,
    width: '80em',
  },
})

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
  const { classes } = useStyles()
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
          <TextField
            variant="outlined"
            multiline
            className={classes.dialogContent}
            minRows={5}
            maxRows={10}
            fullWidth
            value={`>${name}\n${sequence.replaceAll('-', '')}`}
            InputProps={{
              readOnly: true,
              classes: {
                input: classes.textAreaFont,
              },
            }}
          />
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
