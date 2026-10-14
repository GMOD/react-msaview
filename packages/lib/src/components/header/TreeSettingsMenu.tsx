import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import AccountTree from '@mui/icons-material/AccountTree'
import { observer } from 'mobx-react'

import { treeSettingsMenuItems } from './settingsMenuItems.ts'

import type { MsaViewModel } from '../../model.ts'

const TreeSettingsMenu = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  return model.noTree ? null : (
    <CascadingMenuButton
      data-testid="tree_settings_menu"
      tooltip="Tree settings"
      closeAfterItemClick={false}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      menuItems={treeSettingsMenuItems(model)}
    >
      <AccountTree />
    </CascadingMenuButton>
  )
})

export default TreeSettingsMenu
