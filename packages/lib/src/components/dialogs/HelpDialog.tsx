import React, { lazy } from 'react'

import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'

import { version } from '../../version.ts'
import { keyboardControls, mouseControls } from '../controls.ts'

import type { MsaViewModel } from '../../model.ts'
import type { Control } from '../controls.ts'

const AboutDialog = lazy(() => import('./AboutDialog.tsx'))

function ControlTable({ title, rows }: { title: string; rows: Control[] }) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        {title}
      </Typography>
      <Table size="small" aria-label={title}>
        <TableBody>
          {rows.map(({ label, action }) => (
            <TableRow key={label}>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                {label}
              </TableCell>
              <TableCell>{action}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default function HelpDialog({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  return (
    <Dialog open title="Mouse & keyboard" onClose={onClose}>
      <DialogContent>
        <ControlTable title="Mouse" rows={mouseControls} />
        <ControlTable
          title="Keyboard (click the alignment first)"
          rows={keyboardControls}
        />
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" sx={{ mr: 'auto', pl: 1 }}>
          MSAView {version}
        </Typography>
        <Button
          onClick={() => {
            model.queueDialog(done => [AboutDialog, { onClose: done }])
            onClose()
          }}
        >
          About & credits
        </Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
