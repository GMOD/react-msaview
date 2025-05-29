import React, { lazy, useEffect } from 'react'

import useMeasure from '@jbrowse/core/util/useMeasure'
import Help from '@mui/icons-material/Help'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'

import ColorMenu from './ColorMenu'
import HeaderInfoArea from './HeaderInfoArea'
import HeaderMenu from './HeaderMenu'
import HeaderStatusArea from './HeaderStatusArea'
import MSAMenu from './MSAMenu'
import MultiAlignmentSelector from './MultiAlignmentSelector'
import TreeMenu from './TreeMenu'
import ZoomControls from './ZoomControls'
import ZoomMenu from './ZoomMenu'
import ZoomStar from './ZoomStar'

import type { MsaViewModel } from '../../model'

const AboutDialog = lazy(() => import('../dialogs/AboutDialog'))

const Header = observer(function ({ model }: { model: MsaViewModel }) {
  const [ref, { height }] = useMeasure()
  useEffect(() => {
    model.setHeaderHeight(height || 0)
  }, [model, height])
  return (
    <div ref={ref} style={{ display: 'flex' }}>
      <HeaderMenu model={model} />
      <ColorMenu model={model} />
      <TreeMenu model={model} />
      <MSAMenu model={model} />
      <ZoomControls model={model} />
      {model.showZoomStar ? <ZoomStar model={model} /> : null}
      <ZoomMenu model={model} />
      <div style={{ margin: 'auto' }}>
        <MultiAlignmentSelector model={model} />
      </div>
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
