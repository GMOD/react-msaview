import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import AccountTree from '@mui/icons-material/AccountTree'
import FolderOpen from '@mui/icons-material/FolderOpen'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import { observer } from 'mobx-react'

import MenuButtonLabel from './MenuButtonLabel.tsx'
import { getAnnotationsMenu } from './getAnnotationsMenu.ts'

import type { MsaViewModel } from '../../model.ts'

const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog.tsx'))

const FileMenu = observer(({ model }: { model: MsaViewModel }) => {
  return (
    <CascadingMenuButton
      data-testid="file_menu"
      tooltip="File"
      menuItems={[
        ...(model.importForm
          ? [
              {
                label: 'Open another alignment…',
                icon: FolderOpen,
                onClick: () => {
                  model.reset()
                },
              },
            ]
          : []),
        {
          label: 'Annotations',
          type: 'subMenu',
          subMenu: getAnnotationsMenu({
            model,
          }),
        },
        { type: 'divider' },
        {
          label: 'Export SVG…',
          icon: PhotoCamera,
          onClick: () => {
            model.queueDialog(onClose => [
              ExportSVGDialog,
              {
                onClose,
                model,
              },
            ])
          },
        },
        {
          label: 'Export tree (Newick)',
          icon: AccountTree,
          disabled: !!model.tree.noTree,
          onClick: () => {
            model.exportNewick()
          },
        },
      ]}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      sx={{ borderRadius: 1 }}
    >
      <MenuButtonLabel>File</MenuButtonLabel>
    </CascadingMenuButton>
  )
})

export default FileMenu
