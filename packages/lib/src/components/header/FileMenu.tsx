import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import MenuButtonLabel, { menuButtonSx } from './MenuButtonLabel.tsx'
import { openAnnotationFileItem } from './getAnnotationsMenu.ts'

import type { MsaViewModel } from '../../model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog.tsx'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog.tsx'))

export function fileMenuItems(model: MsaViewModel): MenuItem[] {
  return [
    ...(model.importForm
      ? [
          {
            label: 'Open another alignment…',
            onClick: () => {
              model.reset()
            },
          },
        ]
      : []),
    openAnnotationFileItem(model),
    {
      label: 'Export SVG…',
      onClick: () => {
        model.queueDialog(onClose => [ExportSVGDialog, { onClose, model }])
      },
    },
    ...(model.tree.noTree
      ? []
      : [
          {
            label: 'Export tree (Newick)',
            onClick: () => {
              model.exportNewick()
            },
          },
        ]),
    {
      label: 'Metadata…',
      onClick: () => {
        model.queueDialog(onClose => [MetadataDialog, { model, onClose }])
      },
    },
  ]
}

const FileMenu = observer(({ model }: { model: MsaViewModel }) => {
  return (
    <CascadingMenuButton
      data-testid="file_menu"
      tooltip="File"
      menuItems={fileMenuItems(model)}
      sx={menuButtonSx}
    >
      <MenuButtonLabel>File</MenuButtonLabel>
    </CascadingMenuButton>
  )
})

export default FileMenu
