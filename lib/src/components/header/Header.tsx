import React, { lazy } from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

// icons
import Help from '@mui/icons-material/Help'

// locals
import ZoomControls from './ZoomControls'
import MultiAlignmentSelector from './MultiAlignmentSelector'
import HeaderInfoArea from './HeaderInfoArea'
import HeaderStatusArea from './HeaderStatusArea'
import HeaderMenuExtra from './HeaderMenuExtra'

const AboutDialog = lazy(() => import('../dialogs/AboutDialog'))

const Header = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ display: 'flex' }}>
      <ZoomControls model={model} />
      <HeaderMenuExtra model={model} />
      <MultiAlignmentSelector model={model} />
      <HeaderInfoArea model={model} />
      <Spacer />
      <HeaderStatusArea model={model} />
      <IconButton
        onClick={() => model.queueDialog(onClose => [AboutDialog, { onClose }])}
      >
        <Help />
      </IconButton>
    </div>
  )
})

function Spacer() {
  return <div style={{ flex: 1 }} />
}

export default Header
