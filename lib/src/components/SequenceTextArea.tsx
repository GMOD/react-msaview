import React from 'react'
import { TextField } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()({
  textAreaFont: {
    fontFamily: 'Courier New',
  },
  dialogContent: {
    background: 'lightgrey',
    margin: 4,
    minWidth: '80em',
  },
})
export default function SequenceTextArea({ str }: { str: string }) {
  const { classes } = useStyles()

  return (
    <TextField
      variant="outlined"
      multiline
      className={classes.dialogContent}
      minRows={5}
      maxRows={10}
      fullWidth
      value={str}
      InputProps={{
        readOnly: true,
        classes: {
          input: classes.textAreaFont,
        },
      }}
    />
  )
}
