import React, { lazy, useEffect } from 'react'

import useMeasure from '@jbrowse/core/util/useMeasure'
import Help from '@mui/icons-material/Help'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'

import HeaderInfoArea from './HeaderInfoArea'
import HeaderMenuExtra from './HeaderMenuExtra'
import HeaderStatusArea from './HeaderStatusArea'
import MultiAlignmentSelector from './MultiAlignmentSelector'
import ZoomControls from './ZoomControls'

import type { MsaViewModel } from '../../model'

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
        onClick={() => {
          model.queueDialog(onClose => [AboutDialog, { onClose }])
        }}
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
