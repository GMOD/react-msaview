import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import GridOn from '@mui/icons-material/GridOn'
import Settings from '@mui/icons-material/Settings'
import { observer } from 'mobx-react'

import colorSchemes from '../../colorSchemes'

import type { MsaViewModel } from '../../model'

// lazies
const SettingsDialog = lazy(() => import('../dialogs/SettingsDialog'))

const SettingsMenu = observer(({ model }: { model: MsaViewModel }) => {
  const {
    drawTree,
    showBranchLen,
    labelsAlignRight,
    drawNodeBubbles,
    drawLabels,
    treeWidthMatchesArea,
    drawMsaLetters,
    noTree,
    bgColor,
    hideGaps,
    contrastLettering,
    colorSchemeName,
  } = model
  return (
    <CascadingMenuButton
      closeAfterItemClick={false}
      menuItems={[
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
          subMenu: [
            {
              label: 'Draw letters',
              type: 'checkbox',
              checked: drawMsaLetters,
              onClick: () => {
                model.setDrawMsaLetters(!drawMsaLetters)
              },
            },
            {
              label: 'Color background tiles of MSA?',
              type: 'checkbox',
              checked: bgColor,
              onClick: () => {
                model.setBgColor(!bgColor)
              },
            },
            {
              label: 'Use contrast lettering',
              type: 'checkbox',
              checked: contrastLettering,
              onClick: () => {
                model.setContrastLettering(!contrastLettering)
              },
            },
            {
              label: 'Enable hiding gappy columns?',
              type: 'checkbox',
              checked: hideGaps,
              onClick: () => {
                model.setHideGaps(!hideGaps)
              },
            },
          ],
        },
        {
          label: 'Color scheme',
          type: 'subMenu',
          icon: ColorLensIcon,
          subMenu: Object.keys(colorSchemes).map(
            option =>
              ({
                label: option,
                type: 'radio',
                checked: colorSchemeName === option,
                onClick: () => {
                  model.setColorSchemeName(option)
                },
              }) as const,
          ),
        },
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
      ]}
    >
      <Settings />
    </CascadingMenuButton>
  )
})

export default SettingsMenu
