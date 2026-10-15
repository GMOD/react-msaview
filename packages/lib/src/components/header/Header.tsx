import React, { useEffect } from 'react'

import useMeasure from '@jbrowse/core/util/useMeasure'
import Tune from '@mui/icons-material/Tune'
import { AppBar, Button, Toolbar } from '@mui/material'
import { observer } from 'mobx-react'

import StatusMessage from '../StatusMessage.tsx'
import HeaderInfoArea from './HeaderInfoArea.tsx'
import HiddenColumnsChip from './HiddenColumnsChip.tsx'
import LoadWarnings from './LoadWarnings.tsx'
import MenuBar from './MenuBar.tsx'
import MultiAlignmentSelector from './MultiAlignmentSelector.tsx'
import ScrollZoomCheckbox from './ScrollZoomCheckbox.tsx'
import SelectionMenu from './SelectionMenu.tsx'
import UnshareableDataWarning from './UnshareableDataWarning.tsx'
import ZoomControls from './ZoomControls.tsx'

import type { MsaViewModel } from '../../model.ts'

export interface ToolbarSlots {
  toolbarStart?: React.ReactNode
  toolbarEnd?: React.ReactNode
}

const Header = observer(function ({
  model,
  toolbarStart,
  toolbarEnd,
}: { model: MsaViewModel } & ToolbarSlots) {
  const [ref, { height }] = useMeasure()
  useEffect(() => {
    model.setHeaderHeight(height ?? 0)
  }, [model, height])
  useEffect(
    () => () => {
      model.setHeaderHeight(0)
    },
    [model],
  )
  return (
    <AppBar
      ref={ref}
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar
        variant="dense"
        disableGutters
        sx={{ minHeight: 40, flexWrap: 'wrap', px: 0.5 }}
      >
        {toolbarStart}
        <MenuBar model={model} />
        <Button
          data-testid="settings_button"
          size="small"
          startIcon={<Tune />}
          color={model.settingsOpen ? 'primary' : 'inherit'}
          variant={model.settingsOpen ? 'outlined' : 'text'}
          onClick={() => {
            model.setSettingsOpen(!model.settingsOpen)
          }}
          sx={{ mx: 0.5, flexShrink: 0 }}
        >
          Settings
        </Button>
        <ZoomControls model={model} />
        <ScrollZoomCheckbox model={model} />
        <HiddenColumnsChip model={model} />
        <div style={{ paddingLeft: 20, margin: 'auto' }}>
          <MultiAlignmentSelector model={model} />
        </div>
        {/* zero flex-basis, so what appears here on a selection or a hover
            shrinks into the header's spare width and never wraps it */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
          <SelectionMenu model={model} />
          <HeaderInfoArea model={model} />
        </div>
        <LoadWarnings model={model} />
        <UnshareableDataWarning model={model} />
        <StatusMessage model={model} variant="header" />
        {toolbarEnd}
      </Toolbar>
    </AppBar>
  )
})

export default Header
