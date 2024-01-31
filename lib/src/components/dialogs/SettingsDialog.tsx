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
  FormControlLabelProps,
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
  flex: {
    display: 'flex',
  },
}))

function FormControlLabel2(rest: FormControlLabelProps) {
  return (
    <div>
      <FormControlLabel {...rest} />
    </div>
  )
}

const SettingsContent = observer(function ({ model }: { model: MsaViewModel }) {
  const { classes } = useStyles()
  const {
    bgColor,
    colWidth,
    colorSchemeName,
    drawTree,
    drawNodeBubbles,
    labelsAlignRight,
    noTree,
    rowHeight,
    showBranchLen,
    treeWidthMatchesArea,
    treeWidth,
  } = model
  return (
    <>
      <div>
        <h1>Tree options</h1>
        <FormControlLabel2
          control={
            <Checkbox
              checked={showBranchLen}
              onChange={() => model.setShowBranchLen(!showBranchLen)}
            />
          }
          label="Show branch length?"
        />

        <FormControlLabel2
          control={
            <Checkbox
              checked={drawNodeBubbles}
              onChange={() => model.setDrawNodeBubbles(!drawNodeBubbles)}
            />
          }
          label="Draw clickable bubbles on tree branches?"
        />
        <FormControlLabel2
          control={
            <Checkbox
              checked={drawTree}
              onChange={() => model.setDrawTree(!drawTree)}
            />
          }
          label="Show tree?"
        />

        <FormControlLabel2
          control={
            <Checkbox
              checked={labelsAlignRight}
              onChange={() => model.setLabelsAlignRight(!labelsAlignRight)}
            />
          }
          label="Tree labels align right?"
        />
        {!noTree ? (
          <div>
            <FormControlLabel2
              control={
                <Checkbox
                  checked={treeWidthMatchesArea}
                  onChange={() =>
                    model.setTreeWidthMatchesArea(!treeWidthMatchesArea)
                  }
                />
              }
              label="Make tree width fit to tree area?"
            />
            {!treeWidthMatchesArea ? (
              <div className={classes.flex}>
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
          </div>
        ) : null}
      </div>
      <div>
        <h1>MSA options</h1>

        <FormControlLabel2
          control={
            <Checkbox
              checked={bgColor}
              onChange={() => model.setBgColor(!bgColor)}
            />
          }
          label="Color background tiles of MSA?"
        />

        <div className={classes.flex}>
          <Typography>Column width ({colWidth}px)</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={50}
            value={colWidth}
            onChange={(_, val) => model.setColWidth(val as number)}
          />
        </div>
        <div className={classes.flex}>
          <Typography>Row height ({rowHeight}px)</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={50}
            value={rowHeight}
            onChange={(_, val) => model.setRowHeight(val as number)}
          />
        </div>

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
      </div>
    </>
  )
})

const SettingsDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  return (
    <Dialog open onClose={() => onClose()} title="Settings">
      <DialogContent>
        <SettingsContent model={model} />
        <DialogActions>
          <Button onClick={() => onClose()} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
})

export default SettingsDialog
