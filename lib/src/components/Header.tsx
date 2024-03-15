import React, { lazy } from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../model'

// icons
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Help from '@mui/icons-material/Help'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'
import Menu from '@mui/icons-material/Menu'

// locals
import ZoomControls from './ZoomControls'
import MultiAlignmentSelector from './MultiAlignmentSelector'
import HeaderInfoArea from './HeaderInfoArea'

const SettingsDialog = lazy(() => import('./dialogs/SettingsDialog'))
const AboutDialog = lazy(() => import('./dialogs/AboutDialog'))
const MetadataDialog = lazy(() => import('./dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('./dialogs/TracklistDialog'))

const Header = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ display: 'flex' }}>
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Return to import form',
            icon: FolderOpen,
            onClick: async () => {
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
            },
          },
          {
            label: 'Settings',
            onClick: () =>
              model.queueDialog(onClose => [
                SettingsDialog,
                { model, onClose },
              ]),
            icon: Settings,
          },
          {
            label: 'Metadata',
            onClick: () =>
              model.queueDialog(onClose => [
                MetadataDialog,
                { model, onClose },
              ]),
            icon: Assignment,
          },
          {
            label: 'Tracks',
            onClick: () =>
              model.queueDialog(onClose => [
                TracklistDialog,
                { model, onClose },
              ]),
            icon: List,
          },
        ]}
      >
        <Menu />
      </CascadingMenuButton>
      <Spacer />
      <MultiAlignmentSelector model={model} />
      <ZoomControls model={model} />
      <HeaderInfoArea model={model} />
      <Spacer />
      <IconButton
        onClick={() => model.queueDialog(onClose => [AboutDialog, { onClose }])}
      >
        <Help />
      </IconButton>
    </div>
  )
})

function Spacer() {
  return <div style={{ flex: 1 }} />
}

export default Header
