import React, { lazy } from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../model'

// icons
import MoreVert from '@mui/icons-material/MoreVert'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'

// lazies
const ExportSVGDialog = lazy(() => import('./ExportSVGDialog'))

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
            label: 'Reset zoom to default',
            onClick: () => {
              model.setColWidth(16)
              model.setRowHeight(20)
            },
          },
          {
            label: 'Export SVG',
            onClick: () =>
              model.queueDialog(onClose => [
                ExportSVGDialog,
                { onClose, model },
              ]),
          },
        ]}
      >
        <MoreVert />
      </CascadingMenuButton>
    </>
  )
})
export default ZoomControls
