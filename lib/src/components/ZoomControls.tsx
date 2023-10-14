import React from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../model'

// icons
import MoreVert from '@mui/icons-material/MoreVert'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'

const ZoomControls = observer(function ZoomControls({
  model,
}: {
  model: MsaViewModel
}) {
  const { colWidth, rowHeight } = model
  return (
    <>
      <IconButton
        onClick={() => {
          model.setColWidth(Math.ceil(colWidth * 1.5))
          model.setRowHeight(Math.ceil(rowHeight * 1.5))
        }}
      >
        <ZoomIn />
      </IconButton>
      <IconButton
        onClick={() => {
          model.setColWidth(Math.max(1, Math.floor(colWidth * 0.75)))
          model.setRowHeight(Math.max(1.5, Math.floor(rowHeight * 0.75)))
        }}
      >
        <ZoomOut />
      </IconButton>
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Decrease row height',
            onClick: () => {
              model.setRowHeight(Math.max(1.5, rowHeight * 0.75))
            },
          },
          {
            label: 'Increase row height',
            onClick: () => {
              model.setRowHeight(rowHeight * 1.5)
            },
          },
          {
            label: 'Decrease col width',
            onClick: () => {
              model.setColWidth(Math.max(1, colWidth * 0.75))
            },
          },
          {
            label: 'Increase col width',
            onClick: () => {
              model.setColWidth(colWidth * 1.5)
            },
          },
          {
            label: 'Reset zoom to default',
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
