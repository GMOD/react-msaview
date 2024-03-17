import React from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

const TreeRuler = observer(({ model }: { model: MsaViewModel }) => {
  const { treeAreaWidth } = model
  return <div style={{ flexShrink: 0, width: treeAreaWidth }} />
})

export default TreeRuler
