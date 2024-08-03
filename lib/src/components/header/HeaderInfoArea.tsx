import React from 'react'
import { Typography } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

// locals
import type { MsaViewModel } from '../../model'

const useStyles = makeStyles()({
  margin: {
    margin: 'auto',
    marginLeft: 10,
  },
})

const HeaderInfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  const { classes } = useStyles()
  return mouseOverRowName && mouseCol !== undefined ? (
    <Typography className={classes.margin}>
      {mouseOverRowName}:
      {model.globalCoordToRowSpecificSeqCoord(mouseOverRowName, mouseCol)}
    </Typography>
  ) : null
})

export default HeaderInfoArea
