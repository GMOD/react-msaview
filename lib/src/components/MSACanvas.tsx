import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Typography, CircularProgress, useTheme } from '@material-ui/core'
import normalizeWheel from 'normalize-wheel'
import Color from 'color'
import { observer } from 'mobx-react'

import colorSchemes from '../colorSchemes'
import { transform } from '../util'
import { MsaViewModel } from '../model'

const MSABlock = observer(
  ({
    model,
    offsetX,
    offsetY,
  }: {
    model: MsaViewModel
    offsetX: number
    offsetY: number
  }) => {
    const {
      MSA,
      colWidth,
      bgColor,
      columns,
      rowHeight,
      scrollY,
      scrollX,
      hierarchy,
      colorSchemeName,
      blockSize,
      mouseCol,
    } = model
    const theme = useTheme()

    const colorScheme = colorSchemes[colorSchemeName]
    const colorContrast = useMemo(
      () =>
        transform(colorScheme, ([letter, color]) => [
          letter,
          theme.palette.getContrastText(Color(color).hex()),
        ]),
      [colorScheme, theme.palette],
    )
    const ref = useRef<HTMLCanvasElement>(null)
    const mouseoverRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
      if (!ref.current) {
        return
      }

      const ctx = ref.current.getContext('2d')
      if (!ctx) {
        return
      }

      ctx.resetTransform()
      ctx.clearRect(0, 0, blockSize, blockSize)
      ctx.translate(-offsetX, rowHeight / 2 - offsetY)
      ctx.textAlign = 'center'
      ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 12)}px`)

      const leaves = hierarchy.leaves()
      const b = blockSize

      // slice vertical rows, e.g. tree leaves, avoid negative slice
      const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
      const yEnd = Math.max(0, Math.ceil((offsetY + b + rowHeight) / rowHeight))

      // slice horizontal visible letters, avoid negative slice
      const xStart = Math.max(0, Math.floor(offsetX / colWidth))
      const xEnd = Math.max(0, Math.ceil((offsetX + b) / colWidth))
      const visibleLeaves = leaves.slice(yStart, yEnd)
      visibleLeaves.forEach((node) => {
        const {
          //@ts-ignore
          x: y,
          //@ts-ignore
          data: { name },
        } = node

        const str = columns[name]?.slice(xStart, xEnd)
        for (let i = 0; i < str?.length; i++) {
          const letter = str[i]
          const color = colorScheme[letter.toUpperCase()]
          if (bgColor) {
            const x = i * colWidth + offsetX - (offsetX % colWidth)
            ctx.fillStyle = color || 'white'
            ctx.fillRect(x, y - rowHeight, colWidth, rowHeight)
          }
        }
      })

      if (rowHeight >= 10 && colWidth >= rowHeight / 2) {
        visibleLeaves.forEach((node) => {
          const {
            //@ts-ignore
            x: y,
            //@ts-ignore
            data: { name },
          } = node

          const str = columns[name]?.slice(xStart, xEnd)
          for (let i = 0; i < str?.length; i++) {
            const letter = str[i]
            const color = colorScheme[letter.toUpperCase()]
            const contrast = colorContrast[letter.toUpperCase()] || 'black'
            const x = i * colWidth + offsetX - (offsetX % colWidth)

            //note: -rowHeight/4 matches +rowHeight/4 in tree
            ctx.fillStyle = bgColor ? contrast : color || 'black'
            ctx.fillText(
              letter,
              Math.floor(x + colWidth / 2),
              Math.floor(y - rowHeight / 4),
            )
          }
        })
      }
    }, [
      MSA,
      columns,
      colorScheme,
      colorContrast,
      bgColor,
      rowHeight,
      colWidth,
      hierarchy,
      offsetX,
      offsetY,
      blockSize,
    ])

    useEffect(() => {
      if (!mouseoverRef.current) {
        return
      }

      const ctx = mouseoverRef.current.getContext('2d')
      if (!ctx) {
        return
      }

      ctx.resetTransform()
      ctx.clearRect(0, 0, blockSize, blockSize)
      ctx.translate(-offsetX, -offsetY)
      if (
        mouseCol &&
        mouseCol > offsetX / colWidth &&
        mouseCol < (offsetX + blockSize) / colWidth
      ) {
        const x = (mouseCol - 1) * colWidth

        console.log(x)
        ctx.fillStyle = 'rgba(100,100,100,0.5)'
        ctx.fillRect(x, 0, colWidth, 1000)
      }
    }, [mouseCol, blockSize, colWidth, offsetX, offsetY, rowHeight])

    return (
      <div style={{ position: 'relative' }}>
        <canvas
          ref={ref}
          onMouseMove={(event) => {
            if (!ref.current) {
              return
            }
            const { left, top } = ref.current.getBoundingClientRect()
            const mouseX = event.clientX - left
            const mouseY = event.clientY - top
            model.setMousePos(
              Math.floor((mouseX + offsetX) / colWidth) + 1,
              Math.floor((mouseY + offsetY) / rowHeight),
            )
          }}
          onMouseLeave={() => model.setMousePos()}
          width={blockSize}
          height={blockSize}
          style={{
            position: 'absolute',
            top: scrollY + offsetY,
            left: scrollX + offsetX,
            width: blockSize,
            height: blockSize,
          }}
        />
        <canvas
          ref={mouseoverRef}
          width={blockSize}
          height={blockSize}
          style={{
            position: 'absolute',
            top: scrollY + offsetY,
            left: scrollX + offsetX,
            width: blockSize,
            height: blockSize,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
)

const MSACanvas = observer(({ model }: { model: MsaViewModel }) => {
  const { MSA, msaFilehandle, height, msaAreaWidth, blocksX, blocksY } = model
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

  function mouseDown(event: React.MouseEvent) {
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
  }

  // this local mouseup is used in addition to the global because sometimes
  // the global add/remove are not called in time, resulting in issue #533
  function mouseUp(event: React.MouseEvent) {
    event.preventDefault()
    setMouseDragging(false)
  }

  function mouseLeave(event: React.MouseEvent) {
    event.preventDefault()
  }

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
      onMouseDown={mouseDown}
      onMouseUp={mouseUp}
      onMouseLeave={mouseLeave}
      style={{
        position: 'relative',
        height,
        width: msaAreaWidth,
        overflow: 'hidden',
      }}
    >
      {!MSA && !msaFilehandle ? null : !MSA ? (
        <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
          <CircularProgress />
          <Typography>Loading...</Typography>
        </div>
      ) : (
        blocksY
          .map((by) =>
            blocksX.map((bx) => (
              <MSABlock
                key={`${bx}_${by}`}
                model={model}
                offsetX={bx}
                offsetY={by}
              />
            )),
          )
          .flat()
      )}
    </div>
  )
})

export default MSACanvas
