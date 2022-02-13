import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Typography, CircularProgress, useTheme } from '@material-ui/core'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'

// locals
import { MsaViewModel } from '../model'
import { colorContrast } from '../util'
import { getClustalXColor, getPercentIdentityColor } from '../colorSchemes'

import * as PIXI from 'pixi.js'

import { Stage, Graphics } from '@inlet/react-pixi'

function Rectangle(props: any) {
  const draw = useCallback(
    g => {
      g.clear()
      g.beginFill(props.color)
      g.drawRect(props.x, props.y, props.width, props.height)
      g.endFill()
    },
    [props],
  )

  return <Graphics draw={draw} />
}

const MSABlock = observer(({ model }: { model: MsaViewModel }) => {
  const {
    msaAreaWidth,
    height,
    colWidth,
    bgColor,
    columns,
    rowHeight,
    hierarchy,
    colorScheme,
    colorSchemeName,
    colStats,
    scrollX,
  } = model
  const theme = useTheme()

  const contrastScheme = useMemo(
    () => colorContrast(colorScheme, theme),
    [colorScheme, theme],
  )
  console.log({ scrollX })

  return (
    <Stage width={msaAreaWidth} height={height}>
      {hierarchy.leaves().map(node => {
        const {
          //@ts-ignore
          x: y,
          //@ts-ignore
          data: { name },
        } = node

        return columns[name].split('').map((letter, i) => {
          const color =
            colorSchemeName === 'clustalx_protein_dynamic'
              ? getClustalXColor(colStats[i], model, name, i)
              : colorSchemeName === 'percent_identity_dynamic'
              ? getPercentIdentityColor(colStats[i], model, name, i)
              : colorScheme[letter.toUpperCase()]
          if (bgColor) {
            const x = i * colWidth
            const hex = PIXI.utils.string2hex(color || '')
            return (
              <Rectangle
                key={y + '_' + x}
                color={hex}
                x={x + scrollX}
                y={y - rowHeight}
                width={colWidth}
                height={rowHeight}
              />
            )
          }
        })
      })}
    </Stage>
  )
})

const MSACanvas = observer(({ model }: { model: MsaViewModel }) => {
  const { MSA, msaFilehandle } = model
  const ref = useRef<HTMLDivElement>(null)
  // wheel
  const scheduled = useRef(false)
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  // mouse click-and-drag scrolling
  const prevX = useRef<number>(0)
  const prevY = useRef<number>(0)
  const [mouseDragging, setMouseDragging] = useState(false)
  useEffect(() => {
    const curr = ref.current
    if (!curr) {
      return
    }
    function onWheel(origEvent: WheelEvent) {
      const event = normalizeWheel(origEvent)
      deltaX.current += event.pixelX
      deltaY.current += event.pixelY

      if (!scheduled.current) {
        scheduled.current = true
        requestAnimationFrame(() => {
          model.doScrollX(-deltaX.current)
          model.doScrollY(-deltaY.current)
          deltaX.current = 0
          deltaY.current = 0
          scheduled.current = false
        })
      }
      origEvent.preventDefault()
    }
    curr.addEventListener('wheel', onWheel)
    return () => {
      curr.removeEventListener('wheel', onWheel)
    }
  }, [model])

  useEffect(() => {
    let cleanup = () => {}

    function globalMouseMove(event: MouseEvent) {
      event.preventDefault()
      const currX = event.clientX
      const currY = event.clientY
      const distanceX = currX - prevX.current
      const distanceY = currY - prevY.current
      if (distanceX || distanceY) {
        // use rAF to make it so multiple event handlers aren't fired per-frame
        // see https://calendar.perfplanet.com/2013/the-runtime-performance-checklist/
        if (!scheduled.current) {
          scheduled.current = true
          window.requestAnimationFrame(() => {
            model.doScrollX(distanceX)
            model.doScrollY(distanceY)
            scheduled.current = false
            prevX.current = event.clientX
            prevY.current = event.clientY
          })
        }
      }
    }

    function globalMouseUp() {
      prevX.current = 0
      if (mouseDragging) {
        setMouseDragging(false)
      }
    }

    if (mouseDragging) {
      window.addEventListener('mousemove', globalMouseMove, true)
      window.addEventListener('mouseup', globalMouseUp, true)
      cleanup = () => {
        window.removeEventListener('mousemove', globalMouseMove, true)
        window.removeEventListener('mouseup', globalMouseUp, true)
      }
    }
    return cleanup
  }, [model, mouseDragging])

  return (
    <div
      ref={ref}
      onMouseDown={event => {
        // check if clicking a draggable element or a resize handle
        const target = event.target as HTMLElement
        if (target.draggable || target.dataset.resizer) {
          return
        }

        // otherwise do click and drag scroll
        if (event.button === 0) {
          prevX.current = event.clientX
          prevY.current = event.clientY
          setMouseDragging(true)
        }
      }}
      onMouseUp={event => {
        event.preventDefault()
        setMouseDragging(false)
      }}
      onMouseLeave={event => {
        event.preventDefault()
      }}
    >
      {!MSA && !msaFilehandle ? null : !MSA ? (
        <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </div>
      ) : (
        <MSABlock model={model} />
      )}
    </div>
  )
})

export default MSACanvas
