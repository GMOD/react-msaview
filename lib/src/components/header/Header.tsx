import React, { lazy, useEffect } from 'react'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'
import useMeasure from '@jbrowse/core/util/useMeasure'

// locals
import type { MsaViewModel } from '../../model'

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
  const [ref, { height }] = useMeasure()
  useEffect(() => {
    model.setHeaderHeight(height || 0)
  }, [model, height])
  return (
    <div ref={ref} style={{ display: 'flex' }}>
      <HeaderMenuExtra model={model} />
      <ZoomControls model={model} />
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
