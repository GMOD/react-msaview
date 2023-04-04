import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'
import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material'

import { MsaViewModel } from '../model'
import colorSchemes from '../colorSchemes'

const useStyles = makeStyles()(theme => ({
  field: {
    margin: theme.spacing(4),
  },
}))

export default observer(function ({
  model,
  onClose,
  open,
}: {
  model: MsaViewModel
  onClose: () => void
  open: boolean
}) {
  const { classes } = useStyles()
  const { colorSchemeName, noTree } = model
  const [rowHeight, setRowHeight] = useState(`${model.rowHeight}`)
  const [colWidth, setColWidth] = useState(`${model.colWidth}`)
  const [treeWidth, setTreeWidth] = useState(`${model.treeWidth}`)

  function error(n: string) {
    return Number.isNaN(+n) || +n < 0
  }
  const rowHeightError = error(rowHeight)
  const colWidthError = error(colWidth)
  const treeWidthError = error(treeWidth)

  return (
    <Dialog onClose={() => onClose()} open={open} title="Settings">
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={model.showBranchLen}
              onChange={() => model.toggleBranchLen()}
            />
          }
          label="Show branch length"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={model.bgColor}
              onChange={() => model.toggleBgColor()}
            />
          }
          label="Color background"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={model.drawNodeBubbles}
              onChange={() => model.toggleNodeBubbles()}
            />
          }
          label="Draw node bubbles"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={model.drawTree}
              onChange={() => model.toggleDrawTree()}
            />
          }
          label="Draw tree (if available)"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={model.labelsAlignRight}
              onChange={() => model.toggleLabelsAlignRight()}
            />
          }
          label="Labels align right (note: labels may draw over tree, but can adjust tree width or tree area width in UI)"
        />

        <TextField
          className={classes.field}
          label="Row height (px)"
          value={rowHeight}
          error={rowHeightError}
          onChange={event => setRowHeight(event.target.value)}
        />
        <TextField
          className={classes.field}
          label="Column width (px)"
          value={colWidth}
          error={colWidthError}
          onChange={event => setColWidth(event.target.value)}
        />
        <br />
        {!noTree ? (
          <TextField
            className={classes.field}
            label="Tree width (px)"
            value={treeWidth}
            error={treeWidthError}
            onChange={event => setTreeWidth(event.target.value)}
          />
        ) : null}

        <br />

        <TextField
          select
          label="Color scheme"
          value={colorSchemeName}
          onChange={event => model.setColorSchemeName(event.target.value)}
        >
          {Object.keys(colorSchemes).map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <DialogActions>
          <Button
            disabled={rowHeightError || colWidthError || treeWidthError}
            onClick={() => {
              model.setRowHeight(+rowHeight)
              model.setColWidth(+colWidth)
              if (!noTree) {
                model.setTreeWidth(+treeWidth)
              }
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
})
