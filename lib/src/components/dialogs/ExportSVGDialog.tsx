import React, { useState } from 'react'

import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
} from '@mui/material'

// locals
import Checkbox2 from '../Checkbox2'

import type { MsaViewModel } from '../../model'

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
    <Dialog
      onClose={() => {
        onClose()
      }}
      open
      title="Export SVG"
    >
      <DialogContent>
        {error ? <ErrorMessage error={error} /> : null}
        <Typography>Settings:</Typography>
        <Checkbox2
          label="Include minimap?"
          disabled={exportType === 'entire'}
          checked={includeMinimap}
          onChange={() => {
            setIncludeMinimap(!includeMinimap)
          }}
        />
        <div>
          <FormControl>
            <FormLabel>Export type</FormLabel>
            <RadioGroup
              value={exportType}
              onChange={event => {
                setExportType(event.target.value)
              }}
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
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ;(async () => {
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
            })()
          }}
        >
          Submit
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            onClose()
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}
