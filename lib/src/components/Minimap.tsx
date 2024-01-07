import React from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

const Minimap = observer(function ({ model }: { model: MsaViewModel }) {
  const {
    scrollX,
    msaAreaWidth: W,
    minimapHeight: H,
    colWidth,
    numColumns,
  } = model
  const unit = W / numColumns
  const left = -scrollX
  const right = left + W
  const s = (left / colWidth) * unit
  const e = (right / colWidth) * unit
  const TOP = 10
  const fill = 'rgba(66, 119, 127, 0.3)'
  return (
    <svg height={H} style={{ width: '100%' }}>
      <rect x={0} y={0} width={W} height={TOP} stroke="black" fill="none" />
      <rect x={s} y={0} width={e - s} height={TOP} fill={fill} />
      <polygon
        fill={fill}
        points={[
          [e, TOP],
          [s, TOP],
          [0, H],
          [W, H],
        ].toString()}
      />
    </svg>
  )
})

export default Minimap
