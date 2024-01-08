import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import OverviewRubberband from './OverviewRubberband'

const Minimap = observer(function ({ model }: { model: MsaViewModel }) {
  const [mouseDownCoordX, setMouseDownCoordX] = useState<number>()
  const [mouseCurrCoordX, setMouseCurrCoordX] = useState<number>()
  const ref = useRef<SVGSVGElement>(null)
  const {
    scrollX,
    msaAreaWidth: W,
    minimapHeight: H,
    colWidth,
    numColumns,
  } = model
  const unit = W / numColumns / colWidth
  const left = -scrollX
  const right = left + W
  const s = left * unit
  const e = right * unit
  const TOP = 10
  const fill = 'rgba(66, 119, 127, 0.3)'

  useEffect(() => {
    if (mouseDownCoordX !== undefined) {
      function fn(event: MouseEvent) {
        setMouseCurrCoordX(event.clientX)
      }
      document.addEventListener('mousemove', fn)
      return () => {
        document.removeEventListener('mousemove', fn)
      }
    }
  }, [mouseDownCoordX])

  const rect = ref.current?.getBoundingClientRect()
  const l = (mouseDownCoordX || 0) - (rect?.left || 0)
  const r = (mouseCurrCoordX || 0) - (rect?.left || 0)
  const l2 = Math.min(l, r)
  const r2 = Math.max(l, r)
  return (
    <div style={{ width: '100%' }}>
      <OverviewRubberband
        model={model}
        ControlComponent={<div style={{ background: '#f00c', height: 12 }} />}
      />
      <rect x={s} y={0} width={e - s} height={TOP} fill={fill} />
      {mouseDownCoordX !== undefined && mouseCurrCoordX !== undefined ? (
        <rect x={l2} y={0} width={r2 - l2} height={TOP} fill={'black'} />
      ) : null}
      <svg ref={ref} height={H} style={{ width: '100%' }}>
        <polygon
          fill={fill}
          points={[
            [e, 0],
            [s, 0],
            [0, H],
            [W, H],
          ].toString()}
        />
      </svg>
    </div>
  )
})

export default Minimap
