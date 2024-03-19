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
  return (
    <>
      <IconButton onClick={() => model.zoomIn()}>
        <ZoomIn />
      </IconButton>
      <IconButton onClick={() => model.zoomOut()}>
        <ZoomOut />
      </IconButton>
    </>
  )
})
export default ZoomControls
