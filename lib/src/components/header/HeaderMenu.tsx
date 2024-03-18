import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import { transaction } from 'mobx'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// icons
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'
import Menu from '@mui/icons-material/Menu'

// locals
import { MsaViewModel } from '../../model'

const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('../dialogs/TracklistDialog'))

const HeaderMenu = observer(function ({ model }: { model: MsaViewModel }) {
  const { featureMode } = model
  return (
    <CascadingMenuButton
      menuItems={[
        {
          label: 'Return to import form',
          icon: FolderOpen,
          onClick: () => {
            transaction(() => {
              model.setData({ tree: '', msa: '' })
              model.clearSelectedStructures()
              model.setScrollY(0)
              model.setScrollX(0)
              model.setCurrentAlignment(0)
              model.setTreeFilehandle(undefined)
              model.setMSAFilehandle(undefined)
            })
          },
        },
        {
          label: 'Settings',
          onClick: () =>
            model.queueDialog(onClose => [SettingsDialog, { model, onClose }]),
          icon: Settings,
        },
        {
          label: 'Metadata',
          onClick: () =>
            model.queueDialog(onClose => [MetadataDialog, { model, onClose }]),
          icon: Assignment,
        },
        {
          label: 'Tracks',
          onClick: () =>
            model.queueDialog(onClose => [TracklistDialog, { model, onClose }]),
          icon: List,
        },
        {
          label: 'Feature mode',
          onClick: () => model.setFeatureMode(!featureMode),
          checked: featureMode,
          type: 'checkbox',
        },
      ]}
    >
      <Menu />
    </CascadingMenuButton>
  )
})

export default HeaderMenu
