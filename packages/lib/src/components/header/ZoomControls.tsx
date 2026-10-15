import React from 'react'

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
      <Tooltip title="Fit the whole alignment in the window">
        <IconButton
          aria-label="Fit to window"
          onClick={() => {
            model.fit()
          }}
        >
          <FitScreen />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset zoom to the default cell size (0)">
        <IconButton
          aria-label="Reset zoom"
          onClick={() => {
            model.resetZoom()
          }}
        >
          <RestartAlt />
        </IconButton>
      </Tooltip>
    </>
  )
})

export default ZoomControls
