import React from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

// icons
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
    </>
  )
})
export default ZoomControls
