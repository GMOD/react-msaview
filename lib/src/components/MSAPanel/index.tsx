import React from 'react'
import { observer } from 'mobx-react'

// locals
import MSACanvas from './MSACanvas'
import MSAMouseoverCanvas from './MSAMouseoverCanvas'
import BoxFeatureCanvas from './BoxFeatureCanvas'
// types
import { MsaViewModel } from '../../model'

const MSAPanel = observer(function ({ model }: { model: MsaViewModel }) {
  const { featureMode } = model
  return (
    <div style={{ position: 'relative' }}>
      {featureMode ? (
        <BoxFeatureCanvas model={model} />
      ) : (
        <MSACanvas model={model} />
      )}
      <MSAMouseoverCanvas model={model} />
    </div>
  )
})

export default MSAPanel
