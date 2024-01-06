import React from 'react'
import { observer } from 'mobx-react'

import { MsaViewModel } from '../../model'
import TreeCanvas from './TreeCanvas'

const TreePanel = observer(function ({ model }: { model: MsaViewModel }) {
  const { treeAreaWidth } = model
  return (
    <div style={{ flexShrink: 0, width: treeAreaWidth }}>
      <TreeCanvas model={model} />
    </div>
  )
})

export default TreePanel
