import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import AccountTree from '@mui/icons-material/AccountTree'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model'

const TreeMenu = observer(({ model }: { model: MsaViewModel }) => {
  const {
    drawTree,
    showBranchLen,
    labelsAlignRight,
    drawNodeBubbles,
    drawLabels,
    treeWidthMatchesArea,
    noTree,
  } = model
  return (
    <CascadingMenuButton
      closeAfterItemClick={false}
      menuItems={[
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
      ]}
    >
      <AccountTree />
    </CascadingMenuButton>
  )
})

export default TreeMenu
