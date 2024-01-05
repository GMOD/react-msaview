import React, { Suspense, lazy, useState } from 'react'
import { IconButton, Typography } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'

// icons
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Help from '@mui/icons-material/Help'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'
import ZoomControls from './ZoomControls'
import MultiAlignmentSelector from './MultiAlignmentSelector'

const SettingsDialog = lazy(() => import('./dialogs/SettingsDlg'))
const AboutDialog = lazy(() => import('./dialogs/AboutDlg'))
const MetadataDialog = lazy(() => import('./dialogs/MetadataDlg'))
const TracklistDialog = lazy(() => import('./dialogs/TracklistDlg'))

const InfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  return (
    <div>
      <Typography display="inline">Row name: {mouseOverRowName}</Typography>
      <span style={{ marginLeft: 10 }} />
      <Typography display="inline">Position: {mouseCol}</Typography>
    </div>
  )
})

const Header = observer(function ({ model }: { model: MsaViewModel }) {
  const [settingsDialogViz, setSettingsDialogViz] = useState(false)
  const [aboutDialogViz, setAboutDialogViz] = useState(false)
  const [detailsDialogViz, setMetadataDialogViz] = useState(false)
  const [tracklistDialogViz, setTracklistDialogViz] = useState(false)

  return (
    <div style={{ display: 'flex' }}>
      <IconButton
        onClick={async () => {
          try {
            model.setData({ tree: '', msa: '' })
            model.clearSelectedStructures()
            model.setScrollY(0)
            model.setScrollX(0)
            model.setCurrentAlignment(0)
            await model.setTreeFilehandle(undefined)
            await model.setMSAFilehandle(undefined)
          } catch (e) {
            console.error(e)
            model.setError(e)
          }
        }}
      >
        <FolderOpen />
      </IconButton>
      <IconButton onClick={() => setSettingsDialogViz(true)}>
        <Settings />
      </IconButton>
      <IconButton onClick={() => setMetadataDialogViz(true)}>
        <Assignment />
      </IconButton>
      <IconButton onClick={() => setTracklistDialogViz(true)}>
        <List />
      </IconButton>
      <Suspense fallback={null}>
        {settingsDialogViz ? (
          <SettingsDialog
            model={model}
            onClose={() => setSettingsDialogViz(false)}
          />
        ) : null}
        {aboutDialogViz ? (
          <AboutDialog onClose={() => setAboutDialogViz(false)} />
        ) : null}
        {detailsDialogViz ? (
          <MetadataDialog
            model={model}
            onClose={() => setMetadataDialogViz(false)}
          />
        ) : null}

        {tracklistDialogViz ? (
          <TracklistDialog
            model={model}
            onClose={() => setTracklistDialogViz(false)}
          />
        ) : null}
      </Suspense>
      <MultiAlignmentSelector model={model} />
      <ZoomControls model={model} />
      <InfoArea model={model} />
      <Spacer />
      <IconButton onClick={() => setAboutDialogViz(true)}>
        <Help />
      </IconButton>
    </div>
  )
})

function Spacer() {
  return <div style={{ flex: 1 }} />
}

export default Header
