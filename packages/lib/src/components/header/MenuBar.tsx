import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import Build from '@mui/icons-material/Build'
import Help from '@mui/icons-material/Help'
import InsertDriveFile from '@mui/icons-material/InsertDriveFile'
import Visibility from '@mui/icons-material/Visibility'
import { Tooltip } from '@mui/material'
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

const menus: [string, (model: MsaViewModel) => MenuItem[], React.ReactNode][] =
  [
    ['File', fileMenuItems, <InsertDriveFile key="file" />],
    ['View', viewMenuItems, <Visibility key="view" />],
    ['Tools', toolsMenuItems, <Build key="tools" />],
    ['Help', helpMenuItems, <Help key="help" />],
  ]

const MenuBar = observer(function ({ model }: { model: MsaViewModel }) {
  const { embeddedMode } = model
  return menus.map(([name, items, icon]) => {
    const button = (
      <CascadingMenuButton
        key={name}
        data-testid={`${name.toLowerCase()}_menu`}
        aria-label={name}
        menuItems={items(model)}
        sx={menuButtonSx}
      >
        {embeddedMode ? icon : name}
      </CascadingMenuButton>
    )
    return embeddedMode ? (
      <Tooltip key={name} title={name}>
        {button}
      </Tooltip>
    ) : (
      button
    )
  })
})

export default MenuBar
