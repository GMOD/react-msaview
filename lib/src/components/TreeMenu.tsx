import React, { lazy } from 'react'
import { Menu, MenuItem } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'

const MoreInfoDlg = lazy(() => import('./dialogs/MoreInfoDlg'))

const TreeMenu = observer(function ({
  node,
  onClose,
  model,
}: {
  node: { x: number; y: number; name: string }
  model: MsaViewModel
  onClose: () => void
}) {
  const { structures } = model
  const nodeDetails = node ? model.getRowData(node.name) : undefined

  return (
    <>
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
            model.setDialogComponent(MoreInfoDlg, {
              info: model.getRowData(node.name),
            })
            onClose()
          }}
        >
          More info...
        </MenuItem>

        {structures[node.name]?.map(entry => {
          return !model.selectedStructures.some(n => n.id === node.name) ? (
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
          )
        })}

        {// @ts-expect-error
        nodeDetails?.data.accession?.map(accession => (
          <MenuItem
            dense
            key={accession}
            onClick={() => {
              model.addUniprotTrack({
                // @ts-expect-error
                name: nodeDetails?.data.name,
                accession,
              })
              onClose()
            }}
          >
            Open UniProt track ({accession})
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})

export default TreeMenu