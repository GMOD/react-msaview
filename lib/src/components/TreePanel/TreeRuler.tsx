import React from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'

const TreeRuler = observer(({ model }: { model: MsaViewModel }) => {
  const { treeWidth } = model
  return <div style={{ width: treeWidth }} />
})

export default TreeRuler
