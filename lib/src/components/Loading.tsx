import React from 'react'

import { observer } from 'mobx-react'
import { Typography } from '@mui/material'

// locals
import ImportForm from './ImportForm'
import MSAView from './MSAView'
import { MsaViewModel } from '../model'

const Loading = observer(function ({ model }: { model: MsaViewModel }) {
  const { done, initialized } = model

  return (
    <div>
      {!initialized ? (
        <ImportForm model={model} />
      ) : !done ? (
        <Typography variant="h4">Loading...</Typography>
      ) : (
        <MSAView model={model} />
      )}
    </div>
  )
})

export default Loading
