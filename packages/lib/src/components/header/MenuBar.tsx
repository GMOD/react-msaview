import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import {
  fileMenuItems,
  helpMenuItems,
  toolsMenuItems,
  viewMenuItems,
} from './menuBarItems.ts'

import type { MsaViewModel } from '../../model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'
import type { SxProps, Theme } from '@mui/material'

// CascadingMenuButton renders an IconButton on every core a host may ship, so
// these styles give it the look of a small text Button
const menuButtonSx: SxProps<Theme> = {
  borderRadius: 1,
  typography: 'button',
  color: 'text.primary',
  px: 1,
  py: 0.5,
}

const menus: [string, (model: MsaViewModel) => MenuItem[]][] = [
  ['File', fileMenuItems],
  ['View', viewMenuItems],
  ['Tools', toolsMenuItems],
  ['Help', helpMenuItems],
]

const MenuBar = observer(function ({ model }: { model: MsaViewModel }) {
  return menus.map(([name, items]) => (
    <CascadingMenuButton
      key={name}
      data-testid={`${name.toLowerCase()}_menu`}
      menuItems={items(model)}
      sx={menuButtonSx}
    >
      {name}
    </CascadingMenuButton>
  ))
})

export default MenuBar
