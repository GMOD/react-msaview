import React, { lazy } from 'react'
import { Menu, MenuItem } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

// lazies
const TreeNodeInfoDialog = lazy(() => import('./dialogs/TreeNodeInfoDialog'))

const TreeMenu = observer(function ({
  node,
  onClose,
  model,
}: {
  node: { x: number; y: number; name: string; id: string }
  model: MsaViewModel
  onClose: () => void
}) {
  const { selectedStructures, collapsed, collapsed2, structures } = model
  const nodeDetails = node ? model.getRowData(node.name) : undefined

  return (
    <Menu
      anchorReference="anchorPosition"
      anchorPosition={{
        top: node.y,
        left: node.x,
      }}
      transitionDuration={0}
      keepMounted
      open={Boolean(node)}
      onClose={onClose}
    >
      <MenuItem dense disabled>
        {node.name}
      </MenuItem>

      <MenuItem
        dense
        onClick={() => {
          model.queueDialog(onClose => [
            TreeNodeInfoDialog,
            {
              info: model.getRowData(node.name),
              model,
              nodeName: node.name,
              onClose,
            },
          ])
          onClose()
        }}
      >
        More info...
      </MenuItem>
      <MenuItem
        dense
        onClick={() => {
          if (collapsed.includes(node.id)) {
            model.toggleCollapsed(node.id)
          } else {
            if (node.id.endsWith('-leafnode')) {
              model.toggleCollapsed2(`${node.id}`)
            } else {
              model.toggleCollapsed2(`${node.id}-leafnode`)
            }
          }
          onClose()
        }}
      >
        {collapsed.includes(node.id) || collapsed2.includes(node.id)
          ? 'Show node'
          : 'Hide node'}
      </MenuItem>

      {structures[node.name]?.map(entry =>
        !selectedStructures.some(n => n.id === node.name) ? (
          <MenuItem
            key={JSON.stringify(entry)}
            dense
            onClick={() => {
              model.addStructureToSelection({
                structure: entry,
                id: node.name,
              })
              onClose()
            }}
          >
            Add PDB to selection ({entry.pdb})
          </MenuItem>
        ) : (
          <MenuItem
            key={JSON.stringify(entry)}
            dense
            onClick={() => {
              model.removeStructureFromSelection({
                structure: entry,
                id: node.name,
              })
              onClose()
            }}
          >
            Remove PDB from selection ({entry.pdb})
          </MenuItem>
        ),
      )}
    </Menu>
  )
})

export default TreeMenu
