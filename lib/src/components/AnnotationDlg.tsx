import React, { useState } from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
} from '@material-ui/core'

import { MsaViewModel } from '../model'

const Row = observer(
  ({
    name,
    value,
    setValue,
    setName,
  }: {
    name: string
    value: string
    setValue: (arg: string) => void
    setName: (arg: string) => void
  }) => {
    return (
      <div>
        <TextField
          value={name}
          onChange={event => setName(event.target.value)}
          label="Key"
        />
        <TextField
          value={value}
          onChange={event => setValue(event.target.value)}
          label="Value"
        />
      </div>
    )
  },
)
export default observer(
  ({
    onClose,
    data,
    model,
  }: {
    model: MsaViewModel
    onClose: () => void
    data: { left: number; right: number }
  }) => {
    const { left, right } = data
    const [rows, setRows] = useState([['name', '']])
    return (
      <Dialog onClose={() => onClose()} open>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to add an annotation to the MSA at {left}..{right} (real
            position {model.getRealPos(left)}..{model.getRealPos(right)})
          </Typography>
          {rows.map(([key, val], index) => (
            <Row
              key={key}
              name={key}
              value={val}
              setValue={newValue => {
                const newRows = [...rows]
                newRows[index][1] = newValue
                setRows(newRows)
              }}
              setName={newName => {
                const newRows = [...rows]
                newRows[index][0] = newName
                setRows(newRows)
              }}
            />
          ))}
          <Button
            onClick={() => {
              setRows([...rows, ['', '']])
            }}
          >
            Add row
          </Button>

          <DialogActions>
            <Button
              onClick={() => {
                model.addRelativeAnnotation(
                  left,
                  right,
                  Object.fromEntries(rows),
                )
                onClose()
              }}
              variant="contained"
              color="primary"
            >
              Submit
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  },
)
