import React from 'react'

import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import ArrowDropUp from '@mui/icons-material/ArrowDropUp'
import ArrowLeft from '@mui/icons-material/ArrowLeft'
import ArrowRight from '@mui/icons-material/ArrowRight'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'
import { IconButton } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

import { RestartAlt } from '@mui/icons-material'

import type { MsaViewModel } from '../../model'

const useStyles = makeStyles()({
  dpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    margin: 0,
  },
  icon: {
    padding: 0,
    margin: 0,
  },
})

const ZoomStar = observer(function ({ model }: { model: MsaViewModel }) {
  const { classes } = useStyles()
  return (
    <div className={classes.dpad}>
      <div />
      <IconButton
        className={classes.icon}
        onClick={() => {
          model.zoomInVertical()
        }}
      >
        Y+
      </IconButton>
      <div />

      <IconButton
        className={classes.icon}
        onClick={() => {
          model.zoomOutHorizontal()
        }}
      >
        X-
      </IconButton>
      <IconButton
        onClick={() => {
          model.resetZoom()
        }}
      >
        <RestartAlt />
      </IconButton>
      <IconButton
        className={classes.icon}
        onClick={() => {
          model.zoomInHorizontal()
        }}
      >
        X+
      </IconButton>

      <div />
      <IconButton
        className={classes.icon}
        onClick={() => {
          model.zoomOutVertical()
        }}
      >
        Y-
      </IconButton>
      <div />
    </div>
  )
})

export default ZoomStar
