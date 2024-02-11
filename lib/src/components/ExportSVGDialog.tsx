import React, { useState } from 'react'
import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  useTheme,
  Typography,
} from '@mui/material'
import { MsaViewModel } from '../model'

export default function ExportSVGDialog({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const [includeMinimap, setIncludeMinimap] = useState(true)
  const [error, setError] = useState<unknown>()
  const theme = useTheme()
  return (
    <Dialog onClose={() => onClose()} open title="Export SVG">
      <DialogContent>
        <Typography>Export SVG of current view</Typography>
        {error ? <ErrorMessage error={error} /> : null}
        <FormControlLabel
          control={
            <Checkbox
              checked={includeMinimap}
              onChange={event => setIncludeMinimap(event.target.checked)}
            />
          }
          label="Include minimap?"
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              await model.exportSVG({ theme, includeMinimap })
            } catch (e) {
              console.error(e)
              setError(e)
            }
            onClose()
          }}
        >
          Submit
        </Button>
        <Button variant="contained" color="secondary" onClick={() => onClose()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}
