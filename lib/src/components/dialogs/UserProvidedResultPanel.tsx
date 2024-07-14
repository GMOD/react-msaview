import React, { useState } from 'react'
import { observer } from 'mobx-react'

import {
  Button,
  DialogActions,
  DialogContent,
  FormControlLabel,
  FormControl,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'

// locals
import { MsaViewModel } from '../../model'
import { getSession } from '@jbrowse/core/util'
import { textfetch } from '../../fetchUtils'

const FeatureTypeDialog = observer(function ({
  handleClose,
  model,
}: {
  handleClose: () => void
  model: MsaViewModel
}) {
  const [file, setFile] = useState<File>()
  const [choice, setChoice] = useState('file')
  const [interProURL, setInterProURL] = useState('')

  return (
    <>
      <DialogContent>
        <div style={{ display: 'flex', margin: 30 }}>
          <Typography>Open a JSON file of InterProScan results</Typography>

          <FormControl component="fieldset">
            <RadioGroup
              value={choice}
              onChange={event => setChoice(event.target.value)}
            >
              <FormControlLabel value="url" control={<Radio />} label="URL" />
              <FormControlLabel value="file" control={<Radio />} label="File" />
            </RadioGroup>
          </FormControl>
          {choice === 'url' ? (
            <div>
              <Typography>Open a InterProScan JSON file remote URL</Typography>
              <TextField
                label="URL"
                value={interProURL}
                onChange={event => setInterProURL(event.target.value)}
              />
            </div>
          ) : null}
          {choice === 'file' ? (
            <div style={{ paddingTop: 20 }}>
              <Typography>
                Open a InterProScan JSON file file from your local drive
              </Typography>
              <Button variant="outlined" component="label">
                Choose File
                <input
                  type="file"
                  hidden
                  onChange={({ target }) => {
                    const file = target?.files?.[0]
                    if (file) {
                      setFile(file)
                    }
                  }}
                />
              </Button>
            </div>
          ) : null}
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
                const ret: any = file
                  ? await file.text()
                  : await textfetch(interProURL)

                model.setLoadedInterProAnnotations(
                  Object.fromEntries(ret.results.map(r => [r.xref[0].id, r])),
                )
                model.setShowDomains(true)
                getSession(model).notify(`Loaded interproscan results`)
              } catch (e) {
                console.error(e)
                getSession(model).notifyError(`${e}`, e)
              } finally {
                model.setStatus()
              }
            })()
            handleClose()
          }}
        >
          Send sequences to InterProScan
        </Button>
      </DialogActions>
    </>
  )
})

export default FeatureTypeDialog
