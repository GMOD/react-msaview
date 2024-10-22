import React from 'react'
import { observer } from 'mobx-react'
import { Button, Typography } from '@mui/material'
import { ErrorBoundary } from '@jbrowse/core/ui/ErrorBoundary'
import { ErrorMessage } from '@jbrowse/core/ui'

// locals
import ImportForm from './import/ImportForm'
import MSAView from './MSAView'
import type { MsaViewModel } from '../model'

const Reset = observer(function ({
  model,
  error,
}: {
  model: MsaViewModel
  error: unknown
}) {
  return (
    <div>
      <ErrorMessage error={error} />
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          model.reset()
        }}
      >
        Return to import form
      </Button>
    </div>
  )
})

const Loading = observer(function ({ model }: { model: MsaViewModel }) {
  const { isLoading, dataInitialized } = model

  return (
    <div>
      <ErrorBoundary
        FallbackComponent={e => <Reset model={model} error={e.error} />}
      >
        {dataInitialized ? (
          isLoading ? (
            <Typography variant="h4">Loading...</Typography>
          ) : (
            <MSAView model={model} />
          )
        ) : (
          <ImportForm model={model} />
        )}
      </ErrorBoundary>
    </div>
  )
})

export default Loading
