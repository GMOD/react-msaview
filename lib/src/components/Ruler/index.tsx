import React, { useRef } from 'react'
import { observer } from 'mobx-react'
// locals
import { MsaViewModel } from '../../model'
import RulerBlock from './RulerBlock'

const Ruler = observer(function ({ model }: { model: MsaViewModel }) {
  const {
    MSA,
    colWidth,
    msaAreaWidth,
    rulerHeight,
    resizeHandleWidth,
    scrollX,
    blocksX,
    blockSize,
  } = model
  const ref = useRef<HTMLDivElement>(null)
  const offsetX = blocksX[0]

  return !MSA ? null : (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: msaAreaWidth,
        cursor: 'crosshair',
        overflow: 'hidden',
        height: rulerHeight,
        background: '#ccc',
      }}
    >
      <svg
        style={{
          width: blocksX.length * blockSize,
          position: 'absolute',
          left: scrollX + offsetX + resizeHandleWidth,
          pointerEvents: 'none',
        }}
      >
        <RulerBlock
          key={offsetX}
          start={offsetX / colWidth}
          end={offsetX / colWidth + (blockSize * blocksX.length) / colWidth}
          bpPerPx={1 / colWidth}
        />
      </svg>
    </div>
  )
})

export default Ruler
