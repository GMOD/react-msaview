import React, { lazy } from 'react'
import { observer } from 'mobx-react'
import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'

// locals
import { MsaViewModel } from '../../model'
import { loadInterProScanResultsWithStatus } from '../../launchInterProScan'

// icons
import MoreVert from '@mui/icons-material/MoreVert'
import Sort from '@mui/icons-material/Sort'
import Visibility from '@mui/icons-material/Visibility'
import FilterAlt from '@mui/icons-material/FilterAlt'
import Search from '@mui/icons-material/Search'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import RestartAlt from '@mui/icons-material/RestartAlt'

// lazies
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog'))
const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureDialog'))
const DomainDialog = lazy(() => import('../dialogs/DomainDialog'))

const HeaderMenuExtra = observer(function ({ model }: { model: MsaViewModel }) {
  const { showDomains, subFeatureRows, noAnnotations, interProScanJobIds } =
    model
  return (
    <CascadingMenuButton
      menuItems={[
        {
          label: 'Reset zoom to default',
          icon: RestartAlt,
          onClick: () => {
            model.setColWidth(16)
            model.setRowHeight(20)
          },
        },
        {
          label: 'Export SVG',
          icon: PhotoCamera,
          onClick: () =>
            model.queueDialog(onClose => [ExportSVGDialog, { onClose, model }]),
        },
        {
          label: 'Features/protein domains',
          type: 'subMenu',
          subMenu: [
            {
              label:
                'Show domains' + (noAnnotations ? ' (no domains loaded)' : ''),
              icon: Visibility,
              checked: showDomains,
              type: 'checkbox',
              onClick: () => model.setShowDomains(!showDomains),
            },
            {
              label: 'Use sub-row layout',
              checked: subFeatureRows,
              icon: Sort,
              type: 'checkbox',
              onClick: () => model.setSubFeatureRows(!subFeatureRows),
            },
            {
              label: 'Filter domains',
              icon: FilterAlt,
              onClick: () => {
                model.queueDialog(onClose => [
                  FeatureFilterDialog,
                  { onClose, model },
                ])
              },
            },
            {
              label: 'Query InterProScan for domains...',
              icon: Search,
              onClick: () =>
                model.queueDialog(handleClose => [
                  DomainDialog,
                  { handleClose, model },
                ]),
            },
            {
              label: 'Load previous InterProScan results...',
              icon: Search,
              type: 'subMenu',
              subMenu: interProScanJobIds.length
                ? interProScanJobIds.map(({ jobId, date }) => ({
                    label:
                      new Date(date).toLocaleString('en-US') + ' - ' + jobId,
                    onClick: () => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      loadInterProScanResultsWithStatus({ jobId, model })
                    },
                  }))
                : [
                    {
                      label: 'No previous searches',
                      disabled: true,
                      onClick: () => {},
                    },
                  ],
            },
          ],
        },
        ...(model.extraViewMenuItems?.() || []),
      ]}
    >
      <MoreVert />
    </CascadingMenuButton>
  )
})

export default HeaderMenuExtra
