import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../../model'

// icons
import MoreVert from '@mui/icons-material/MoreVert'

// lazies
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog'))
const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureFilterDialog'))

const HeaderMenuExtra = observer(function ({ model }: { model: MsaViewModel }) {
  return (
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
            model.queueDialog(onClose => [ExportSVGDialog, { onClose, model }]),
        },
        {
          label: 'View protein domains/features',
          onClick: () => {
            model.queueDialog(onClose => [
              FeatureFilterDialog,
              { onClose, model },
            ])
          },
        },
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default HeaderMenuExtra
