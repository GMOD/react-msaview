import React from 'react'
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
  Slider,
  TextField,
  Typography,
} from '@mui/material'

import { MsaViewModel } from '../../model'
import colorSchemes from '../../colorSchemes'

const useStyles = makeStyles()(theme => ({
  field: {
    margin: theme.spacing(4),
  },
}))

const SettingsDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const { classes } = useStyles()
  const {
    colorSchemeName,
    drawTree,
    labelsAlignRight,
    drawNodeBubbles,
    bgColor,
    treeWidth,
    showBranchLen,
    noTree,
    rowHeight,
    colWidth,
  } = model

  return (
    <Dialog open onClose={() => onClose()} title="Settings">
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={showBranchLen}
              onChange={() => model.setShowBranchLen(!showBranchLen)}
            />
          }
          label="Show branch length"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={bgColor}
              onChange={() => model.setBgColor(!bgColor)}
            />
          }
          label="Color background"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={drawNodeBubbles}
              onChange={() => model.setDrawNodeBubbles(!drawNodeBubbles)}
            />
          }
          label="Draw node bubbles"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={drawTree}
              onChange={() => model.setDrawTree(!drawTree)}
            />
          }
          label="Draw tree (if available)"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={labelsAlignRight}
              onChange={() => model.setLabelsAlignRight(!labelsAlignRight)}
            />
          }
          label="Labels align right (note: labels may draw over tree, but can adjust tree width or tree area width in UI)"
        />

        <div>
          <Typography>Column width ({colWidth}px)</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={50}
            value={colWidth}
            onChange={(_, val) => model.setColWidth(val as number)}
          />
        </div>
        <div>
          <Typography>Row height ({rowHeight}px)</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={50}
            value={rowHeight}
            onChange={(_, val) => model.setRowHeight(val as number)}
          />
        </div>

        {!noTree ? (
          <div>
            <Typography>Tree width ({treeWidth}px)</Typography>
            <Slider
              className={classes.field}
              min={50}
              max={600}
              value={treeWidth}
              onChange={(_, val) => model.setTreeWidth(val as number)}
            />
          </div>
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

export default SettingsDialog
