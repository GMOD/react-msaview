import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import FitScreen from '@mui/icons-material/FitScreen'
import RestartAlt from '@mui/icons-material/RestartAlt'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'
import { IconButton, Tooltip } from '@mui/material'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model.ts'

const ZoomControls = observer(function ZoomControls({
  model,
}: {
  model: MsaViewModel
}) {
  return (
    <>
      <Tooltip title="Zoom in">
        <IconButton
          aria-label="Zoom in"
          onClick={() => {
            model.zoomIn()
          }}
        >
          <ZoomIn />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out">
        <IconButton
          aria-label="Zoom out"
          onClick={() => {
            model.zoomOut()
          }}
        >
          <ZoomOut />
        </IconButton>
      </Tooltip>
      <Tooltip title="Fit to window">
        <IconButton
          aria-label="Fit to window"
          onClick={() => {
            model.fit()
          }}
        >
          <FitScreen />
        </IconButton>
      </Tooltip>
      <CascadingMenuButton
        data-testid="fit_menu"
        tooltip="More zoom options"
        sx={{ paddingInline: 0, borderRadius: 1 }}
        menuItems={[
          {
            label: 'Fit horizontally',
            onClick: () => {
              model.fitHorizontally()
            },
          },
          {
            label: 'Fit vertically',
            onClick: () => {
              model.fitVertically()
            },
          },
          { type: 'divider' },
          {
            label: 'Reset zoom',
            icon: RestartAlt,
            onClick: () => {
              model.resetZoom()
            },
          },
        ]}
      >
        <ArrowDropDown />
      </CascadingMenuButton>
    </>
  )
})

export default ZoomControls
