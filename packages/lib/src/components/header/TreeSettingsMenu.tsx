import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import MenuButtonLabel from './MenuButtonLabel.tsx'
import { treeMenuItems } from './settingsMenuItems.ts'

import type { MsaViewModel } from '../../model.ts'

const TreeSettingsMenu = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  return model.noTree && model.rowMap.size < 2 ? null : (
    <CascadingMenuButton
      data-testid="tree_settings_menu"
      tooltip="Tree options"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      menuItems={treeMenuItems(model)}
      sx={{ borderRadius: 1 }}
    >
      <MenuButtonLabel>Tree</MenuButtonLabel>
    </CascadingMenuButton>
  )
})

export default TreeSettingsMenu
