import React, { lazy } from 'react'
import { Button, IconButton } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'

// icons
import Help from '@mui/icons-material/Help'

// locals
import ZoomControls from './ZoomControls'
import MultiAlignmentSelector from './MultiAlignmentSelector'
import HeaderInfoArea from './HeaderInfoArea'
import HeaderMenu from './HeaderMenu'

const AboutDialog = lazy(() => import('./dialogs/AboutDialog'))
const FeatureTypeFilterDialog = lazy(
  () => import('./dialogs/FeatureTypeFilterDialog'),
)

const Header = observer(function ({ model }: { model: MsaViewModel }) {
  const { featureMode } = model
  return (
    <div style={{ display: 'flex' }}>
      <HeaderMenu model={model} />
      <ZoomControls model={model} />
      <MultiAlignmentSelector model={model} />
      <HeaderInfoArea model={model} />
      <Spacer />
      <IconButton
        onClick={() => model.queueDialog(onClose => [AboutDialog, { onClose }])}
      >
        <Help />
      </IconButton>
      {featureMode ? (
        <Button
          onClick={() => {
            model.queueDialog(onClose => [
              FeatureTypeFilterDialog,
              { onClose, model },
            ])
          }}
        >
          Feature types
        </Button>
      ) : null}
    </div>
  )
})

function Spacer() {
  return <div style={{ flex: 1 }} />
}

export default Header
