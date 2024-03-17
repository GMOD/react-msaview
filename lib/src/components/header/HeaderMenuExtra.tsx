import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../../model'

// icons
import MoreVert from '@mui/icons-material/MoreVert'

// lazies
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog'))
const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureDialog'))

const HeaderMenuExtra = observer(function ({ model }: { model: MsaViewModel }) {
  const { featureMode, subFeatureRows } = model
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
          label: 'Toggle feature mode',
          checked: featureMode,
          type: 'checkbox',
          onClick: () => model.setFeatureMode(!featureMode),
        },
        {
          label: 'Toggle sub-feature rows',
          checked: subFeatureRows,
          type: 'checkbox',
          onClick: () => model.setSubFeatureRows(!subFeatureRows),
        },
        {
          label: 'Protein domains/feature settings',
          onClick: () => {
            model.queueDialog(onClose => [
              FeatureFilterDialog,
              { onClose, model },
            ])
          },
        },
        ...(model.extraViewMenuItems?.() || []),
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default HeaderMenuExtra
