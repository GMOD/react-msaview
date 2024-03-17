import React from 'react'
import { Typography } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

// locals
import { MsaViewModel } from '../../model'

const useStyles = makeStyles()({
  margin: {
    margin: 'auto',
    marginLeft: 10,
  },
})

const HeaderInfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  const { classes } = useStyles()
  return (
    <div className={classes.margin}>
      {mouseOverRowName && mouseCol !== undefined ? (
        <Typography>
          {mouseOverRowName}:
          {model.globalCoordToRowSpecificSeqCoord(mouseOverRowName, mouseCol)}
        </Typography>
      ) : null}
    </div>
  )
})

export default HeaderInfoArea
