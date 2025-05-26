import React from 'react'

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
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

import colorSchemes from '../../colorSchemes'
import Checkbox2 from '../Checkbox2'

import type { MsaViewModel } from '../../model'

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
        label="Show branch length?"
        onChange={() => {
          model.setShowBranchLen(!showBranchLen)
        }}
      />

      <Checkbox2
        checked={drawNodeBubbles}
        label="Draw clickable bubbles on tree branches?"
        onChange={() => {
          model.setDrawNodeBubbles(!drawNodeBubbles)
        }}
      />
      <Checkbox2
        checked={drawTree}
        label="Show tree?"
        onChange={() => {
          model.setDrawTree(!drawTree)
        }}
      />

      <Checkbox2
        checked={labelsAlignRight}
        label="Tree labels align right?"
        onChange={() => {
          model.setLabelsAlignRight(!labelsAlignRight)
        }}
      />

      <Checkbox2
        checked={drawLabels}
        label="Draw labels"
        onChange={() => {
          model.setDrawLabels(!drawLabels)
        }}
      />
      {noTree ? null : (
        <div>
          <Checkbox2
            checked={treeWidthMatchesArea}
            label="Make tree width fit to tree area?"
            onChange={() => {
              model.setTreeWidthMatchesArea(!treeWidthMatchesArea)
            }}
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
                  model.setTreeWidth(val)
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
        label="Draw letters"
        onChange={() => {
          model.setDrawMsaLetters(!drawMsaLetters)
        }}
      />
      <Checkbox2
        checked={bgColor}
        label="Color letters instead of background of tiles"
        onChange={() => {
          model.setBgColor(!bgColor)
        }}
      />
      <Checkbox2
        checked={contrastLettering}
        label="Use contrast lettering"
        onChange={() => {
          model.setContrastLettering(!contrastLettering)
        }}
      />
      <Checkbox2
        checked={hideGaps}
        label="Enable hiding gappy columns?"
        onChange={() => {
          model.setHideGaps(!hideGaps)
        }}
      />
      {hideGaps ? (
        <div className={classes.flex}>
          <Typography>Hide columns w/ &gt;{allowedGappyness}% gaps</Typography>
          <Slider
            className={classes.field}
            min={1}
            max={100}
            value={allowedGappyness}
            onChange={(_, val) => {
              model.setAllowedGappyness(val)
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
            model.setColWidth(val)
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
            model.setRowHeight(val)
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
      title="Settings"
      maxWidth="xl"
      onClose={() => {
        onClose()
      }}
    >
      <DialogContent className={classes.minw}>
        <SettingsContent model={model} />
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onClose()
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
})

export default SettingsDialog
