import React from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

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
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Zoom in horizontal+vertical',
            onClick: () => model.zoomIn(),
          },
          { label: 'Zoom in horizontal', onClick: () => model.zoomInH() },
          { label: 'Zoom in vertical', onClick: () => model.zoomInV() },
        ]}
      >
        <ZoomIn />
      </CascadingMenuButton>
      <CascadingMenuButton
        menuItems={[
          {
            label: 'Zoom out horizontal+vertical',
            onClick: () => model.zoomOut(),
          },
          { label: 'Zoom out horizontal', onClick: () => model.zoomOutH() },
          { label: 'Zoom out vertical', onClick: () => model.zoomOutV() },
        ]}
      >
        <ZoomOut />
      </CascadingMenuButton>
    </>
  )
})

export default ZoomControls
