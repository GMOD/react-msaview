import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// icons
import MoreVert from '@mui/icons-material/Menu'
import Sort from '@mui/icons-material/Sort'
import Visibility from '@mui/icons-material/Visibility'
import FilterAlt from '@mui/icons-material/FilterAlt'
import Search from '@mui/icons-material/Search'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import RestartAlt from '@mui/icons-material/RestartAlt'
import FolderOpen from '@mui/icons-material/FolderOpen'
import Settings from '@mui/icons-material/Settings'
import Assignment from '@mui/icons-material/Assignment'
import List from '@mui/icons-material/List'

// locals
import type { MsaViewModel } from '../../model'

// lazies
const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('../dialogs/TracklistDialog'))
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog'))
const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureDialog'))
const DomainDialog = lazy(() => import('../dialogs/DomainDialog'))

const HeaderMenuExtra = observer(({ model }: { model: MsaViewModel }) => {
  const { showDomains, subFeatureRows, noAnnotations } = model
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
        {
          label: 'Reset zoom to default',
          icon: RestartAlt,
          onClick: () => {
            model.setColWidth(16)
            model.setRowHeight(20)
          },
        },
        {
          label: 'Export SVG',
          icon: PhotoCamera,
          onClick: () =>
            model.queueDialog(onClose => [ExportSVGDialog, { onClose, model }]),
        },
        {
          label: 'Features/protein domains',
          type: 'subMenu',
          subMenu: [
            {
              label: `Show domains${noAnnotations ? ' (no domains loaded)' : ''}`,
              icon: Visibility,
              checked: showDomains,
              type: 'checkbox',
              onClick: () => model.setShowDomains(!showDomains),
            },
            {
              label: 'Use sub-row layout',
              checked: subFeatureRows,
              icon: Sort,
              type: 'checkbox',
              onClick: () => model.setSubFeatureRows(!subFeatureRows),
            },
            {
              label: 'Filter domains',
              icon: FilterAlt,
              onClick: () => {
                model.queueDialog(onClose => [
                  FeatureFilterDialog,
                  { onClose, model },
                ])
              },
            },
            {
              label: 'View domains',
              icon: Search,
              onClick: () =>
                model.queueDialog(handleClose => [
                  DomainDialog,
                  { handleClose, model },
                ]),
            },
          ],
        },
        ...(model.extraViewMenuItems?.() || []),
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default HeaderMenuExtra
