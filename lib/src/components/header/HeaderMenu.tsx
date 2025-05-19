import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import Assignment from '@mui/icons-material/Assignment'
import FolderOpen from '@mui/icons-material/FolderOpen'
import List from '@mui/icons-material/List'
import Menu from '@mui/icons-material/Menu'
import Settings from '@mui/icons-material/Settings'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model'

// lazies
const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('../dialogs/TracklistDialog'))

const HeaderMenu = observer(function ({ model }: { model: MsaViewModel }) {
  const {
    drawTree,
    drawLabels,
    labelsAlignRight,
    drawNodeBubbles,
    showBranchLen,
  } = model
  return (
    <CascadingMenuButton
      menuItems={[
        {
          label: 'Return to import form',
          icon: FolderOpen,
          onClick: () => {
            model.reset()
          },
        },
        {
          label: 'Tree settings',
          type: 'subMenu',
          subMenu: [
            {
              label: 'Show branch length',
              checked: showBranchLen,
              type: 'checkbox',
              onClick: () => {
                model.setShowBranchLen(!showBranchLen)
              },
            },
            {
              label: 'Draw clickable node bubbles on tree branches',
              checked: drawNodeBubbles,
              type: 'checkbox',
              onClick: () => {
                model.setDrawNodeBubbles(!drawNodeBubbles)
              },
            },
            {
              label: 'Show tree',
              checked: drawTree,
              type: 'checkbox',
              onClick: () => {
                model.setDrawTree(!drawTree)
              },
            },
            {
              label: 'Tree labels align right',
              type: 'checkbox',
              checked: labelsAlignRight,
              onClick: () => {
                model.setLabelsAlignRight(!labelsAlignRight)
              },
            },
            {
              label: 'Draw labels',
              type: 'checkbox',
              checked: drawLabels,
              onClick: () => {
                model.setDrawLabels(!labelsAlignRight)
              },
            },
          ],
        },
        {
          label: 'MSA settings',
          type: 'subMenu',
          subMenu: [],
        },
        {
          label: 'More settings',
          onClick: () => {
            model.queueDialog(onClose => [SettingsDialog, { model, onClose }])
          },
          icon: Settings,
        },
        {
          label: 'Metadata',
          onClick: () => {
            model.queueDialog(onClose => [MetadataDialog, { model, onClose }])
          },
          icon: Assignment,
        },
        {
          label: 'Extra tracks',
          onClick: () => {
            model.queueDialog(onClose => [TracklistDialog, { model, onClose }])
          },
          icon: List,
        },
      ]}
    >
      <Menu />
    </CascadingMenuButton>
  )
})

export default HeaderMenu
