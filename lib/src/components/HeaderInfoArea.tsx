import React from 'react'
import { Typography } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'

const HeaderInfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  return (
    <div style={{ width: 400, margin: 'auto' }}>
      {mouseOverRowName && mouseCol !== undefined ? (
        <Typography>
          {mouseOverRowName}:{model.relativePxToBp(mouseOverRowName, mouseCol)}
        </Typography>
      ) : null}
    </div>
  )
})

export default HeaderInfoArea
