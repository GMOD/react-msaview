import React from 'react'

import { observer } from 'mobx-react'

// locals
import MSACanvas from './MSACanvas'
import MSAMouseoverCanvas from './MSAMouseoverCanvas'

// types
import type { MsaViewModel } from '../../model'

const MSAPanel = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <div style={{ position: 'relative' }}>
      <MSACanvas model={model} />
      <MSAMouseoverCanvas model={model} />
    </div>
  )
})

export default MSAPanel
