import React from 'react'

import { observer } from 'mobx-react'
import { Typography } from '@mui/material'

// locals
import ImportForm from './import/ImportForm'
import MSAView from './MSAView'
import { MsaViewModel } from '../model'

const Loading = observer(function ({ model }: { model: MsaViewModel }) {
  const { isLoading, initialized } = model

  return (
    <div>
      {!initialized ? (
        <ImportForm model={model} />
      ) : isLoading ? (
        <Typography variant="h4">Loading...</Typography>
      ) : (
        <MSAView model={model} />
      )}
    </div>
  )
})

export default Loading
