import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import MoreVert from '@mui/icons-material/MoreVert'
import RestartAlt from '@mui/icons-material/RestartAlt'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

// icons

const ZoomControls = observer(function ZoomControls({
  model,
}: {
  model: MsaViewModel
}) {
  return (
    <>
      <IconButton
        onClick={() => {
          model.zoomIn()
        }}
      >
        <ZoomIn />
      </IconButton>
      <IconButton
        onClick={() => {
          model.zoomOut()
        }}
      >
        <ZoomOut />
      </IconButton>
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Zoom in horizontal',
            onClick: () => {
              model.zoomInHorizontal()
            },
          },
          {
            label: 'Zoom in vertical',
            onClick: () => {
              model.zoomInVertical()
            },
          },
          {
            label: 'Zoom out horizontal',
            onClick: () => {
              model.zoomOutHorizontal()
            },
          },

          {
            label: 'Zoom out vertical',
            onClick: () => {
              model.zoomOutVertical()
            },
          },
          {
            label: 'Reset zoom to default',
            icon: RestartAlt,
            onClick: () => {
              model.setColWidth(16)
              model.setRowHeight(20)
            },
          },
        ]}
      >
        <MoreVert />
      </CascadingMenuButton>
    </>
  )
})
export default ZoomControls
