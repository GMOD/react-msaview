import React, { useState } from 'react'
import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  Button,
  Checkbox,
  DialogContent,
  DialogActions,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Typography,
  useTheme,
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
  const [exportType, setExportType] = useState('viewport')
  const [error, setError] = useState<unknown>()
  const theme = useTheme()
  return (
    <Dialog onClose={() => onClose()} open title="Export SVG">
      <DialogContent>
        {error ? <ErrorMessage error={error} /> : null}
        <Typography>Settings:</Typography>
        <div>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeMinimap}
                  onChange={event => setIncludeMinimap(event.target.checked)}
                />
              }
              disabled={exportType === 'entire'}
              label="Include minimap?"
            />
          </FormControl>
        </div>
        <div>
          <FormControl>
            <FormLabel>Export type</FormLabel>
            <RadioGroup
              value={exportType}
              onChange={event => setExportType(event.target.value)}
            >
              <FormControlLabel
                value="entire"
                control={<Radio />}
                label="Entire MSA"
              />
              <FormControlLabel
                value="viewport"
                control={<Radio />}
                label="Current viewport only"
              />
            </RadioGroup>
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              await model.exportSVG({
                theme,
                includeMinimap:
                  exportType === 'entire' ? false : includeMinimap,
                exportType,
              })
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
