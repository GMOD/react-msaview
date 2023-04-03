import React, { useState } from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import { Dialog } from '@jbrowse/core/ui'

// icons
import DeleteIcon from '@mui/icons-material/Delete'

// locals
import { MsaViewModel } from '../model'

const specialFromEntries = (val: string[][]) => {
  const ret = {} as { [key: string]: string[] }
  val.forEach(([key, val]) => {
    if (!ret[key]) ret[key] = [] as string[]
    ret[key].push(val)
  })
  return ret
}

const Row = observer(function ({
  name,
  value,
  setValue,
  setName,
  onDelete,
}: {
  name: string
  value: string
  setValue: (arg: string) => void
  setName: (arg: string) => void
  onDelete: () => void
}) {
  return (
    <div>
      <IconButton onClick={onDelete} style={{ margin: 10 }}>
        <DeleteIcon />
      </IconButton>
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
})

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
    const { blanks } = model
    const { left: l, right: r } = data
    const [rows, setRows] = useState([
      ['Name', ''],
      ['ID', ''],
      ['Note', ''],
    ])
    return (
      <Dialog
        onClose={() => onClose()}
        open
        title="Create new region annotation"
      >
        <DialogContent>
          <Typography>
            Do you want to add an annotation to the MSA at {l}..{r}{' '}
            {blanks.length
              ? ` (gapped ${model.getPos(l)}..${model.getPos(r)}`
              : ''}
          </Typography>
          {rows.map(([key, val], index) => (
            <Row
              key={index}
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
              onDelete={() => {
                rows.splice(index, 1)
                setRows([...rows])
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
                model.addAnnotation(l, r, specialFromEntries(rows))
                onClose()
              }}
              variant="contained"
              color="primary"
            >
              Submit
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  },
)
