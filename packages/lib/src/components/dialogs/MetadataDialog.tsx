import React from 'react'

import { Dialog } from '@jbrowse/core/ui'
import { DialogContent, Typography } from '@mui/material'
import { observer } from 'mobx-react'

import MetadataTable, { isEmpty } from '../MetadataTable.tsx'
import SequenceTextArea from '../SequenceTextArea.tsx'
import { gfLabels, monospaceKeys, sectionLabels } from './metadataLabels.ts'
import { groupGeneral } from './metadataRecord.tsx'

import type { MsaViewModel } from '../../model.ts'

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
        {Object.values(header).every(isEmpty) ? (
          <Typography>This alignment has no metadata.</Typography>
        ) : (
          <>
            {Object.entries(header)
              .filter(([, value]) => !isEmpty(value))
              .map(([section, value]) => (
                <div key={section}>
                  <Typography variant="h6">
                    {sectionLabels[section] ?? section}
                  </Typography>
                  {section === 'General' ? (
                    <MetadataTable
                      record={groupGeneral(value)}
                      labels={gfLabels}
                      monospaceKeys={monospaceKeys}
                    />
                  ) : (
                    <MetadataTable record={value as Record<string, unknown>} />
                  )}
                </div>
              ))}
          </>
        )}
        <Typography variant="h6">Sequences</Typography>
        <SequenceTextArea str={model.rows} />
      </DialogContent>
    </Dialog>
  )
})

export default MetadataDialog
