import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// icons
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'
import Menu from '@mui/icons-material/Menu'

// locals
import { MsaViewModel } from '../../model'

// lazies
const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('../dialogs/TracklistDialog'))

const HeaderMenu = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <CascadingMenuButton
      menuItems={[
        {
          label: 'Return to import form',
          icon: FolderOpen,
          onClick: () => model.reset(),
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
          label: 'Extra tracks',
          onClick: () =>
            model.queueDialog(onClose => [TracklistDialog, { model, onClose }]),
          icon: List,
        },
      ]}
    >
      <Menu />
    </CascadingMenuButton>
  )
})

export default HeaderMenu
