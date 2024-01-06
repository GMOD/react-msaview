import React, { useRef } from 'react'
import { observer } from 'mobx-react'
// locals
import { MsaViewModel } from '../../model'

const Ruler = observer(function ({ model }: { model: MsaViewModel }) {
  return <div>Hello world</div>
})

export default Ruler
