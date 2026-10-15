import React from 'react'

import Close from '@mui/icons-material/Close'
import { Box, IconButton, Typography } from '@mui/material'
import { observer } from 'mobx-react'

import { settingsPanelWidth } from '../../constants.ts'
import { annotationsSubMenu } from '../header/getAnnotationsMenu.ts'
import {
  alignmentSettingsItems,
  colorSettingsItems,
  gapsSubMenu,
  trackSettingsItems,
  treeSubMenu,
} from '../header/menuBarItems.ts'
import MenuItemsForm from './MenuItemsForm.tsx'
import TrackList from './TrackList.tsx'

import type { MsaViewModel } from '../../model.ts'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Box>
  )
}

/**
 * The settings whose effect the user watches as they change them, docked to
 * the right of the alignment so nothing it opens covers the tree or the rows.
 * Each section renders the same items the menus would, through MenuItemsForm.
 */
const SettingsPanel = observer(function ({
  model,
  height,
}: {
  model: MsaViewModel
  height: number
}) {
  const { noTree, noDomains } = model
  return (
    <Box
      data-testid="settings_panel"
      sx={{
        width: settingsPanelWidth,
        height,
        flexShrink: 0,
        overflowY: 'auto',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 0.5,
        }}
      >
        <Typography variant="subtitle1">Settings</Typography>
        <IconButton
          aria-label="Close settings"
          onClick={() => {
            model.setSettingsOpen(false)
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Section title="Color">
        <MenuItemsForm items={colorSettingsItems(model)} />
      </Section>
      {noTree ? null : (
        <Section title="Tree">
          <MenuItemsForm items={treeSubMenu(model)} />
        </Section>
      )}
      <Section title="Alignment">
        <MenuItemsForm items={alignmentSettingsItems(model)} />
        <Typography variant="caption" color="text.secondary">
          Gappy columns
        </Typography>
        <MenuItemsForm items={gapsSubMenu(model)} />
      </Section>
      {noDomains ? null : (
        <Section title="Annotations">
          <MenuItemsForm items={annotationsSubMenu(model)} />
        </Section>
      )}
      <Section title="Tracks">
        <TrackList model={model} />
        <MenuItemsForm items={trackSettingsItems(model)} />
      </Section>
    </Box>
  )
})

export default SettingsPanel
