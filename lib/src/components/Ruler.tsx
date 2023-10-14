import React, { useRef } from 'react'
import { makeStyles } from 'tss-react/mui'
import { observer } from 'mobx-react'
// locals
import { MsaViewModel } from '../model'
import { makeTicks, mathPower } from './util'

const useStyles = makeStyles()({
  majorTickLabel: {
    fontSize: '11px',
  },
  majorTick: {
    stroke: '#555',
  },
  minorTick: {
    stroke: '#999',
  },
})

function RulerBlock({
  start,
  end,
  bpPerPx,
  reversed,
  major,
  minor,
}: {
  start: number
  end: number
  bpPerPx: number
  reversed?: boolean
  major?: boolean
  minor?: boolean
}) {
  const { classes } = useStyles()
  const ticks = makeTicks(start, end, bpPerPx, major, minor)
  return (
    <>
      {ticks.map(tick => {
        const x = (reversed ? end - tick.base : tick.base - start) / bpPerPx
        return (
          <line
            key={tick.base}
            x1={x}
            x2={x}
            y1={11}
            y2={tick.type === 'major' ? 11 + 6 : 11 + 4}
            strokeWidth={1}
            stroke={tick.type === 'major' ? '#555' : '#999'}
            className={
              tick.type === 'major' ? classes.majorTick : classes.minorTick
            }
            data-bp={tick.base}
          />
        )
      })}
      {ticks
        .filter(tick => tick.type === 'major')
        .map(tick => {
          const x = (reversed ? end - tick.base : tick.base - start) / bpPerPx
          return (
            <text
              x={x}
              y={10}
              key={`label-${tick.base}`}
              textAnchor="middle"
              style={{ fontSize: '11px' }}
              className={classes.majorTickLabel}
            >
              {mathPower(tick.base + 1)}
            </text>
          )
        })}
    </>
  )
}

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
