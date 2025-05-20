import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import MoreVert from '@mui/icons-material/MoreVert'
import RestartAlt from '@mui/icons-material/RestartAlt'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model'

const ZoomMenu = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <CascadingMenuButton
      menuItems={[
        {
          label: 'Fit to view',
          onClick: () => {
            model.showEntire()
          },
        },
        {
          label: 'Reset zoom to default',
          icon: RestartAlt,
          onClick: () => {
            model.resetZoom()
          },
        },
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default ZoomMenu
