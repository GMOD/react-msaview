import React from 'react'

import { observer } from 'mobx-react'

import TreeCanvas from './TreeCanvas'

import type { MsaViewModel } from '../../model'

const TreePanel = observer(function ({ model }: { model: MsaViewModel }) {
  const { treeAreaWidth } = model
  return (
    <div style={{ overflow: 'hidden', flexShrink: 0, width: treeAreaWidth }}>
      <TreeCanvas model={model} />
    </div>
  )
})

export default TreePanel
