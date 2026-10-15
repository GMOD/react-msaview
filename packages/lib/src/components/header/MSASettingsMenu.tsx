import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import MenuButtonLabel from './MenuButtonLabel.tsx'
import { viewMenuItems } from './settingsMenuItems.ts'

import type { MsaViewModel } from '../../model.ts'

const MSASettingsMenu = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <CascadingMenuButton
      data-testid="msa_settings_menu"
      tooltip="View options"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      menuItems={viewMenuItems(model)}
      sx={{ borderRadius: 1 }}
    >
      <MenuButtonLabel>View</MenuButtonLabel>
    </CascadingMenuButton>
  )
})

export default MSASettingsMenu
