import React, { useState } from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@material-ui/core'

import { MsaViewModel } from '../model'
import colorSchemes from '../colorSchemes'

export default observer(
  ({
    model,
    onClose,
    open,
  }: {
    model: MsaViewModel
    onClose: () => void
    open: boolean
  }) => {
    const {
      rowHeight: rowHeightInit,
      colWidth: colWidthInit,
      nameWidth: nameWidthInit,
      treeWidth: treeWidthInit,
      colorSchemeName,
      noTree,
    } = model
    const [rowHeight, setRowHeight] = useState('' + rowHeightInit)
    const [colWidth, setColWidth] = useState('' + colWidthInit)
    const [nameWidth, setNameWidth] = useState('' + nameWidthInit)
    const [treeWidth, setTreeWidth] = useState('' + treeWidthInit)

    function error(n: string) {
      return Number.isNaN(+n) || +n < 0
    }
    const rowHeightError = error(rowHeight)
    const colWidthError = error(colWidth)
    const nameWidthError = error(nameWidth)
    const treeWidthError = error(treeWidth)

    return (
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>Settings</DialogTitle>
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
            label="Row height (px)"
            value={rowHeight}
            error={rowHeightError}
            onChange={(event) => setRowHeight(event.target.value)}
          />
          <TextField
            label="Column width (px)"
            value={colWidth}
            error={colWidthError}
            onChange={(event) => setColWidth(event.target.value)}
          />
          <br />
          {!noTree ? (
            <TextField
              label="Tree width (px)"
              value={treeWidth}
              error={treeWidthError}
              onChange={(event) => setTreeWidth(event.target.value)}
            />
          ) : null}
          <TextField
            label="Name width (px)"
            value={nameWidth}
            error={nameWidthError}
            onChange={(event) => setNameWidth(event.target.value)}
          />
          <br />

          <TextField
            select
            label="Color scheme"
            value={colorSchemeName}
            onChange={(event) => model.setColorSchemeName(event.target.value)}
          >
            {Object.keys(colorSchemes).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <br />
          <br />
          <br />
          <Button
            disabled={
              rowHeightError ||
              colWidthError ||
              nameWidthError ||
              treeWidthError
            }
            onClick={() => {
              model.setRowHeight(+rowHeight)
              model.setColWidth(+colWidth)
              model.setNameWidth(+nameWidth)
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
        </DialogContent>
      </Dialog>
    )
  },
)
