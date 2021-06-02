import React from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Header from './Header'
export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized } = model

  if (!initialized) {
    return <ImportForm model={model} />
  } else if (!done) {
    return <Typography variant="h4">Loading...</Typography>
  } else {
    const { height } = model

    return (
      <div style={{ height, overflow: 'hidden' }}>
        <Header model={model} />
        <div
          style={{
            position: 'relative',
            display: 'flex',
          }}
        >
          <TreeCanvas model={model} />
          <MSACanvas model={model} />
        </div>
      </div>
    )
  }
})
