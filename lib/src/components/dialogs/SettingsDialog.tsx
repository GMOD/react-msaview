import React from 'react'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'
import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  DialogActions,
  DialogContent,
  MenuItem,
  Slider,
  TextField,
  Typography,
} from '@mui/material'

import type { MsaViewModel } from '../../model'
import colorSchemes from '../../colorSchemes'
import Checkbox2 from '../Checkbox2'

const useStyles = makeStyles()(theme => ({
  field: {
    margin: theme.spacing(4),
  },
  flex: {
    display: 'flex',
  },
  minw: {
    width: '80em',
  },
}))

const SettingsContent = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <>
      <TreeSettings model={model} />
      <MSASettings model={model} />
    </>
  )
})

const TreeSettings = observer(function TreeSettings({
  model,
}: {
  model: MsaViewModel
}) {
  const { classes } = useStyles()
  const {
    drawTree,
    drawLabels,
    drawNodeBubbles,
    labelsAlignRight,
    noTree,
    showBranchLen,
    treeWidthMatchesArea,
    treeWidth,
  } = model

  return (
    <div>
      <h1>Tree options</h1>
      <Checkbox2
        checked={showBranchLen}
        onChange={() => {
          model.setShowBranchLen(!showBranchLen)
        }}
        label="Show branch length?"
      />

      <Checkbox2
        checked={drawNodeBubbles}
        onChange={() => {
          model.setDrawNodeBubbles(!drawNodeBubbles)
        }}
        label="Draw clickable bubbles on tree branches?"
      />
      <Checkbox2
        checked={drawTree}
        onChange={() => {
          model.setDrawTree(!drawTree)
        }}
        label="Show tree?"
      />

      <Checkbox2
        checked={labelsAlignRight}
        onChange={() => {
          model.setLabelsAlignRight(!labelsAlignRight)
        }}
        label="Tree labels align right?"
      />

      <Checkbox2
        checked={drawLabels}
        onChange={() => {
          model.setDrawLabels(!drawLabels)
        }}
        label="Draw labels"
      />
      {noTree ? null : (
        <div>
          <Checkbox2
            checked={treeWidthMatchesArea}
            onChange={() => {
              model.setTreeWidthMatchesArea(!treeWidthMatchesArea)
            }}
            label="Make tree width fit to tree area?"
          />
          {treeWidthMatchesArea ? null : (
            <div className={classes.flex}>
              <Typography>Tree width ({treeWidth}px)</Typography>
              <Slider
                className={classes.field}
                min={50}
                max={600}
                value={treeWidth}
                onChange={(_, val) => {
                  model.setTreeWidth(val as number)
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
})

const MSASettings = observer(function MSASettings({
  model,
}: {
  model: MsaViewModel
}) {
  const { classes } = useStyles()
  const {
    bgColor,
    contrastLettering,
    colWidth,
    allowedGappyness,
    drawMsaLetters,
    colorSchemeName,
    hideGaps,
    rowHeight,
  } = model

  return (
    <div>
      <h1>MSA options</h1>
      <Checkbox2
        checked={drawMsaLetters}
        onChange={() => {
          model.setDrawMsaLetters(!drawMsaLetters)
        }}
        label="Draw letters"
      />
      <Checkbox2
        checked={bgColor}
        onChange={() => {
          model.setBgColor(!bgColor)
        }}
        label="Color background tiles of MSA?"
      />
      <Checkbox2
        checked={contrastLettering}
        onChange={() => {
          model.setContrastLettering(!contrastLettering)
        }}
        label="Use contrast lettering"
      />
      <Checkbox2
        checked={hideGaps}
        onChange={() => {
          model.setHideGaps(!hideGaps)
        }}
        label={`Hide columns that are ${allowedGappyness}% gaps`}
      />
      {hideGaps ? (
        <div className={classes.flex}>
          <Typography>Allowed gappyness ({100 - allowedGappyness}%)</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={100}
            value={allowedGappyness}
            onChange={(_, val) => {
              model.setAllowedGappyness(val as number)
            }}
          />
        </div>
      ) : null}
      <div className={classes.flex}>
        <Typography>Column width ({colWidth}px)</Typography>
        <Slider
          className={classes.field}
          min={1}
          max={50}
          value={colWidth}
          onChange={(_, val) => {
            model.setColWidth(val as number)
          }}
        />
      </div>
      <div className={classes.flex}>
        <Typography>Row height ({rowHeight}px)</Typography>
        <Slider
          className={classes.field}
          min={1}
          max={50}
          value={rowHeight}
          onChange={(_, val) => {
            model.setRowHeight(val as number)
          }}
        />
      </div>

      <TextField
        select
        label="Color scheme"
        value={colorSchemeName}
        onChange={event => {
          model.setColorSchemeName(event.target.value)
        }}
      >
        {Object.keys(colorSchemes).map(option => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </div>
  )
})

const SettingsDialog = observer(function ({
  model,
  onClose,
}: {
  model: MsaViewModel
  onClose: () => void
}) {
  const { classes } = useStyles()
  return (
    <Dialog
      open
      onClose={() => {
        onClose()
      }}
      title="Settings"
      maxWidth="xl"
    >
      <DialogContent className={classes.minw}>
        <SettingsContent model={model} />
        <DialogActions>
          <Button
            onClick={() => {
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
