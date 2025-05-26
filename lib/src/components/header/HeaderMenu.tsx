import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import Assignment from '@mui/icons-material/Assignment'
import FilterAlt from '@mui/icons-material/FilterAlt'
import FolderOpen from '@mui/icons-material/FolderOpen'
import List from '@mui/icons-material/List'
import MoreVert from '@mui/icons-material/Menu'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import Search from '@mui/icons-material/Search'
import Settings from '@mui/icons-material/Settings'
import Sort from '@mui/icons-material/Sort'
import Visibility from '@mui/icons-material/Visibility'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import GridOn from '@mui/icons-material/GridOn'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model'

// lazies
const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog'))
const TracklistDialog = lazy(() => import('../dialogs/TracklistDialog'))
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog'))
const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureDialog'))
const UserProvidedDomainsDialog = lazy(
  () => import('../dialogs/UserProvidedDomainsDialog'),
)
const InterProScanDialog = lazy(() => import('../dialogs/InterProScanDialog'))

const HeaderMenu = observer(({ model }: { model: MsaViewModel }) => {
  const {
    drawTree,
    showBranchLen,
    labelsAlignRight,
    drawNodeBubbles,
    showDomains,
    actuallyShowDomains,
    subFeatureRows,
    drawLabels,
    treeWidthMatchesArea,
    noDomains,
    noTree,
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
          icon: Settings,
          label: 'Settings',
          type: 'subMenu',
          subMenu: [
            {
              label: 'Tree settings',
              type: 'subMenu',
              icon: AccountTreeIcon,
              subMenu: [
                {
                  label: 'Show branch length',
                  type: 'checkbox',
                  checked: showBranchLen,
                  onClick: () => {
                    model.setShowBranchLen(!showBranchLen)
                  },
                },
                {
                  label: 'Show tree',
                  type: 'checkbox',
                  checked: drawTree,
                  onClick: () => {
                    model.setDrawTree(!drawTree)
                  },
                },
                {
                  label: 'Draw clickable bubbles on tree branches',
                  type: 'checkbox',
                  checked: drawNodeBubbles,
                  onClick: () => {
                    model.setDrawNodeBubbles(!drawNodeBubbles)
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
                    model.setDrawLabels(!drawLabels)
                  },
                },
                ...(noTree
                  ? []
                  : [
                      {
                        label: 'Make tree width fit to tree area',
                        type: 'checkbox' as const,
                        checked: treeWidthMatchesArea,
                        onClick: () => {
                          model.setTreeWidthMatchesArea(!treeWidthMatchesArea)
                        },
                      },
                    ]),
              ],
            },
            {
              label: 'MSA settings',
              type: 'subMenu',
              icon: GridOn,
              subMenu: [],
            },
            {
              label: 'More',
              icon: Settings,
              type: 'subMenu',
              subMenu: [
                {
                  label: 'More settings',
                  onClick: () => {
                    model.queueDialog(onClose => [
                      SettingsDialog,
                      {
                        model,
                        onClose,
                      },
                    ])
                  },
                },
              ],
            },
          ],
        },

        {
          label: 'Metadata',
          icon: Assignment,
          onClick: () => {
            model.queueDialog(onClose => [
              MetadataDialog,
              {
                model,
                onClose,
              },
            ])
          },
        },
        {
          label: ' tracks',
          icon: List,
          onClick: () => {
            model.queueDialog(onClose => [
              TracklistDialog,
              {
                model,
                onClose,
              },
            ])
          },
        },

        {
          label: 'Export SVG',
          icon: PhotoCamera,
          onClick: () => {
            model.queueDialog(onClose => [
              ExportSVGDialog,
              {
                onClose,
                model,
              },
            ])
          },
        },
        {
          label: 'Features/protein domains',
          type: 'subMenu',
          subMenu: [
            {
              label: 'Open domains...',
              icon: FolderOpen,
              onClick: () => {
                model.queueDialog(handleClose => [
                  UserProvidedDomainsDialog,
                  {
                    handleClose,
                    model,
                  },
                ])
              },
            },
            {
              label: 'Query InterProScan for domains...',
              icon: Search,
              onClick: () => {
                model.queueDialog(handleClose => [
                  InterProScanDialog,
                  {
                    handleClose,
                    model,
                  },
                ])
              },
            },
            {
              label: `Show domains${noDomains ? ' (no domains loaded)' : ''}`,
              disabled: noDomains,
              icon: Visibility,
              checked: actuallyShowDomains ? showDomains : false,
              type: 'checkbox',
              onClick: () => {
                model.setShowDomains(!showDomains)
              },
            },
            {
              label: `Use sub-row layout${noDomains ? ' (no domains loaded)' : ''}`,
              disabled: noDomains,
              checked: actuallyShowDomains ? subFeatureRows : false,
              icon: Sort,
              type: 'checkbox',
              onClick: () => {
                model.setSubFeatureRows(!subFeatureRows)
              },
            },
            {
              label: `Filter domains${noDomains ? ' (no domains loaded)' : ''}`,
              icon: FilterAlt,
              disabled: noDomains,
              onClick: () => {
                model.queueDialog(onClose => [
                  FeatureFilterDialog,
                  {
                    onClose,
                    model,
                  },
                ])
              },
            },
          ],
        },
        ...model.extraViewMenuItems(),
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default HeaderMenu
