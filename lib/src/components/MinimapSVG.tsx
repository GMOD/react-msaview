import React from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

const MinimapSVG = observer(function ({ model }: { model: MsaViewModel }) {
  const {
    scrollX,
    msaAreaWidth: W,
    minimapHeight: H,
    colWidth,
    numColumns,
  } = model

  const BAR_HEIGHT = 12
  const H2 = H - 12

  const unit = W / numColumns / colWidth
  const left = -scrollX
  const right = left + W
  const s = left * unit
  const e = right * unit
  const fill = 'rgba(66, 119, 127, 0.3)'

  return (
    <>
      <rect
        x={0}
        y={0}
        width={W}
        height={BAR_HEIGHT}
        stroke="#555"
        fill="none"
      />
      <rect
        x={Math.max(0, s)}
        y={0}
        width={e - s}
        height={BAR_HEIGHT}
        fill={fill}
        stroke="#555"
      />
      <g transform={`translate(0 ${BAR_HEIGHT})`}>
        <polygon
          fill={fill}
          points={[
            [e, 0],
            [s, 0],
            [0, H2],
            [W, H2],
          ].toString()}
        />
      </g>
    </>
  )
})

export default MinimapSVG
