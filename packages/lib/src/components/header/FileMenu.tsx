import React, { lazy } from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import AccountTree from '@mui/icons-material/AccountTree'
import Assignment from '@mui/icons-material/Assignment'
import FolderOpen from '@mui/icons-material/FolderOpen'
import Menu from '@mui/icons-material/Menu'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import { observer } from 'mobx-react'

import { maxNeighborJoiningRows } from '../../constants.ts'
import { getAnnotationsMenu } from './getAnnotationsMenu.ts'

import type { MsaViewModel } from '../../model.ts'

const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog.tsx'))
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog.tsx'))

function neighborJoiningItem(model: MsaViewModel) {
  const rows = model.rowMap.size
  const tooManyRows = rows > maxNeighborJoiningRows
  return {
    label: tooManyRows
      ? `Calculate neighbor joining tree (over ${maxNeighborJoiningRows} rows, use FastTree)`
      : 'Calculate neighbor joining tree (BLOSUM62)',
    icon: AccountTree,
    disabled: tooManyRows || rows < 2,
    onClick: () => {
      try {
        model.calculateNeighborJoiningTreeFromMSA()
      } catch (e) {
        console.error('Failed to calculate NJ tree:', e)
        model.addWarning(e instanceof Error ? e.message : String(e))
      }
    },
  }
}

const FileMenu = observer(({ model }: { model: MsaViewModel }) => {
  return (
    <CascadingMenuButton
      data-testid="file_menu"
      tooltip="File"
      menuItems={[
        ...(model.importForm
          ? [
              {
                label: 'Return to import form',
                icon: FolderOpen,
                onClick: () => {
                  model.reset()
                },
              },
            ]
          : []),
        {
          label: 'Metadata',
          icon: Assignment,
          onClick: () => {
            model.queueDialog(onClose => [
              MetadataDialog,
              {
                model,
                onClose,
              },
            ])
          },
        },
        {
          label: 'Annotations',
          type: 'subMenu',
          subMenu: getAnnotationsMenu({
            model,
          }),
        },
        neighborJoiningItem(model),
        {
          label: 'Export tree (Newick)',
          icon: AccountTree,
          disabled: !!model.tree.noTree,
          onClick: () => {
            model.exportNewick()
          },
        },
        {
          label: 'Export SVG',
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
      ]}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <Menu />
    </CascadingMenuButton>
  )
})

export default FileMenu
