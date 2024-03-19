import React from 'react'
import { observer } from 'mobx-react'
import { Button, Typography } from '@mui/material'
import { ErrorBoundary } from 'react-error-boundary'

// locals
import ImportForm from './import/ImportForm'
import MSAView from './MSAView'
import { MsaViewModel } from '../model'
import { ErrorMessage } from '@jbrowse/core/ui'

function Reset({ model, error }: { model: MsaViewModel; error: unknown }) {
  return (
    <div>
      <ErrorMessage error={error} />
      <Button variant="contained" color="primary" onClick={() => model.reset()}>
        Return to import form
      </Button>
    </div>
  )
}

const Loading = observer(function ({ model }: { model: MsaViewModel }) {
  const { isLoading, initialized } = model

  return (
    <div>
      {!initialized ? (
        <ImportForm model={model} />
      ) : isLoading ? (
        <Typography variant="h4">Loading...</Typography>
      ) : (
        <ErrorBoundary
          fallbackRender={props => <Reset model={model} error={props.error} />}
        >
          <MSAView model={model} />
        </ErrorBoundary>
      )}
    </div>
  )
})

export default Loading
