import React from 'react'
import { makeStyles } from '@material-ui/core'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

/**
 * Given a scale ( bp/px ) and minimum distances (px) between major and minor
 * gridlines, return an object like `{ majorPitch: bp, minorPitch: bp }` giving
 * the gridline pitches to use.
 */
export function chooseGridPitch(
  scale: number,
  minMajorPitchPx: number,
  minMinorPitchPx: number,
) {
  scale = Math.abs(scale)
  const minMajorPitchBp = minMajorPitchPx * scale
  const majorMagnitude = parseInt(
    Number(minMajorPitchBp).toExponential().split(/e/i)[1],
    10,
  )

  let majorPitch = 10 ** majorMagnitude
  while (majorPitch < minMajorPitchBp) {
    majorPitch *= 2
    if (majorPitch >= minMajorPitchBp) {
      break
    }
    majorPitch *= 2.5
  }

  majorPitch = Math.max(majorPitch, 5)

  const majorPitchPx = majorPitch / scale

  let minorPitch = 0
  if (!(majorPitch % 10) && majorPitchPx / 10 >= minMinorPitchPx) {
    minorPitch = majorPitch / 10
  } else if (!(majorPitch % 5) && majorPitchPx / 5 >= minMinorPitchPx) {
    minorPitch = majorPitch / 5
  } else if (!(majorPitch % 2) && majorPitchPx / 2 >= minMinorPitchPx) {
    minorPitch = majorPitch / 2
  }

  return { majorPitch, minorPitch }
}
export function makeTicks(
  start: number,
  end: number,
  bpPerPx: number,
  emitMajor = true,
  emitMinor = true,
) {
  const gridPitch = chooseGridPitch(bpPerPx, 60, 15)

  let minBase = start
  let maxBase = end
  if (minBase === null || maxBase === null) {
    return []
  }

  if (bpPerPx < 0) {
    [minBase, maxBase] = [maxBase, minBase]
  }

  // add 20px additional on the right and left to allow us to draw the ends
  // of labels that lie a little outside our region
  minBase -= Math.abs(20 * bpPerPx)
  maxBase += Math.abs(20 * bpPerPx) + 1

  const iterPitch = gridPitch.minorPitch || gridPitch.majorPitch
  let index = 0
  const ticks = []
  for (
    let base = Math.ceil(minBase / iterPitch) * iterPitch;
    base < maxBase;
    base += iterPitch
  ) {
    if (emitMinor && base % (gridPitch.majorPitch * 2)) {
      ticks.push({ type: 'minor', base: base - 1, index })
      index += 1
    } else if (emitMajor && !(base % (gridPitch.majorPitch * 2))) {
      ticks.push({ type: 'major', base: base - 1, index })
      index += 1
    }
  }
  return ticks
}

function mathPower(num: number): string {
  if (num < 999) {
    return String(num)
  }
  return `${mathPower(~~(num / 1000))},${`00${~~(num % 1000)}`.substr(-3, 3)}`
}

const useStyles = makeStyles((/* theme */) => ({
  majorTickLabel: {
    fontSize: '11px',
    // fill: theme.palette.text.primary,
  },
  majorTick: {
    stroke: '#555',
    // stroke: theme.palette.text.secondary,
  },
  minorTick: {
    stroke: '#999',
    // stroke: theme.palette.text.hint,
  },
}))

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
  const classes = useStyles()
  const ticks = makeTicks(start, end, bpPerPx, major, minor)
  return (
    <>
      {ticks.map((tick) => {
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
        .filter((tick) => tick.type === 'major')
        .map((tick) => {
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
const Ruler = observer(({ model }: { model: MsaViewModel }) => {
  const { colWidth, msaAreaWidth, scrollX, blocksX, blockSize } = model
  const offsetX = blocksX[0]

  return (
    <div
      style={{
        position: 'relative',
        width: msaAreaWidth,
        overflow: 'hidden',
        height: 20,
      }}
    >
      <svg
        style={{
          width: blocksX.length * blockSize,
          position: 'absolute',
          left: scrollX + offsetX,
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
