import React from 'react'

import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'
import { Tooltip, alpha } from '@mui/material'

// icons
import { MsaViewModel } from '../model'

const useStyles = makeStyles()({
  guide: {
    pointerEvents: 'none',
    height: '100%',
    width: 1,
    position: 'absolute',
    zIndex: 10,
  },
})

const VerticalGuide = observer(function ({
  model,
  coordX,
}: {
  model: MsaViewModel
  coordX: number
}) {
  const { treeAreaWidth } = model
  const { classes } = useStyles()
  return (
    <>
      <Tooltip open placement="top" title={`${model.pxToBp(coordX) + 1}`} arrow>
        <div
          style={{
            left: coordX + treeAreaWidth,
            position: 'absolute',
            height: 1,
          }}
        />
      </Tooltip>
      <div
        className={classes.guide}
        style={{
          left: coordX + treeAreaWidth,
          background: 'red',
        }}
      />
    </>
  )
})
export default VerticalGuide
