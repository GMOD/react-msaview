import React, { useState } from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { Tab, Tabs } from '@mui/material'

// locals
import InterProScanPanel from './InterProScanDialog'
import UserProvidedResultPanel from './UserProvidedDomainsDialog'
import TabPanel from './TabPanel'
import type { MsaViewModel } from '../../model'

export default function LaunchDomainViewDialog({
  handleClose,
  model,
}: {
  handleClose: () => void
  model: MsaViewModel
}) {
  const [choice, setChoice] = useState(0)
  return (
    <Dialog
      maxWidth="xl"
      title="Launch protein view"
      onClose={() => handleClose()}
      open
    >
      <Tabs value={choice} onChange={(_, val) => setChoice(val)}>
        <Tab value={0} label="Automatic lookup" />
        <Tab value={1} label="Manual" />
      </Tabs>
      <TabPanel value={choice} index={0}>
        <InterProScanPanel model={model} handleClose={handleClose} />
      </TabPanel>
      <TabPanel value={choice} index={1}>
        <UserProvidedResultPanel model={model} handleClose={handleClose} />
      </TabPanel>
    </Dialog>
  )
}
