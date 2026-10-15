import React, { useState } from 'react'

import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import ArrowRight from '@mui/icons-material/ArrowRight'
import Close from '@mui/icons-material/Close'
import { Box, ButtonBase, IconButton, Typography } from '@mui/material'
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

const collapsedKey = 'msaview-settings-collapsed'

function readCollapsed() {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(collapsedKey) ?? '[]',
    )
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set<string>()
  }
}

function writeCollapsed(collapsed: Set<string>) {
  try {
    localStorage.setItem(collapsedKey, JSON.stringify([...collapsed]))
  } catch {}
}

function Section({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const Arrow = collapsed ? ArrowRight : ArrowDropDown
  return (
    <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <ButtonBase
        aria-expanded={!collapsed}
        onClick={onToggle}
        sx={{ width: '100%', justifyContent: 'flex-start', ml: -0.75 }}
      >
        <Arrow fontSize="small" color="action" />
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
      </ButtonBase>
      {collapsed ? null : children}
    </Box>
  )
}

/**
 * The settings whose effect the user watches as they change them, docked to
 * the right of the alignment so nothing it opens covers the tree or the rows.
 * Each section folds, and the browser remembers which ones the user folded.
 */
const SettingsPanel = observer(function ({
  model,
  height,
}: {
  model: MsaViewModel
  height: number
}) {
  const { noTree, noDomains } = model
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const section = (title: string) => ({
    title,
    collapsed: collapsed.has(title),
    onToggle: () => {
      const next = new Set(collapsed)
      if (!next.delete(title)) {
        next.add(title)
      }
      writeCollapsed(next)
      setCollapsed(next)
    },
  })
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
      <Section {...section('Color')}>
        <MenuItemsForm items={colorSettingsItems(model)} />
      </Section>
      {noTree ? null : (
        <Section {...section('Tree')}>
          <MenuItemsForm items={treeSubMenu(model)} />
        </Section>
      )}
      <Section {...section('Alignment')}>
        <MenuItemsForm items={alignmentSettingsItems(model)} />
        <MenuItemsForm items={gapsSubMenu(model)} />
      </Section>
      {noDomains ? null : (
        <Section {...section('Annotations')}>
          <MenuItemsForm items={annotationsSubMenu(model)} />
        </Section>
      )}
      <Section {...section('Tracks')}>
        <TrackList model={model} />
        <Box sx={{ mt: 1, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
          <MenuItemsForm items={trackSettingsItems(model)} />
        </Box>
      </Section>
    </Box>
  )
})

export default SettingsPanel
