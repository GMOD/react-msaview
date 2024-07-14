import React from 'react'
import { Typography } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'
import { LoadingEllipses } from '@jbrowse/core/ui'

// locals
import { MsaViewModel } from '../../model'

const useStyles = makeStyles()({
  margin: {
    margin: 'auto',
    marginLeft: 10,
  },
})

const HeaderStatusArea = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  const { status } = model
  const { classes } = useStyles()
  return status ? (
    <Typography className={classes.margin}>
      <LoadingEllipses message={status.msg} component="span" />{' '}
      {status.url ? (
        <a href={status.url} target="_blank" rel="noreferrer">
          (status)
        </a>
      ) : null}
    </Typography>
  ) : null
})

export default HeaderStatusArea
