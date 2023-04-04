import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Typography, CircularProgress, useTheme } from '@mui/material'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'

// locals
import { MsaViewModel } from '../model'
import { colorContrast } from '../util'
import { getClustalXColor, getPercentIdentityColor } from '../colorSchemes'

const MSABlock = observer(function ({
  model,
  offsetX,
  offsetY,
}: {
  model: MsaViewModel
  offsetX: number
  offsetY: number
}) {
  const {
    MSA,
    colWidth,
    bgColor,
    columns,
    rowHeight,
    scrollY,
    scrollX,
    hierarchy,
    colorScheme,
    colorSchemeName,
    blockSize,
    highResScaleFactor,
    colStats,
  } = model
  const theme = useTheme()

  const contrastScheme = useMemo(
    () => colorContrast(colorScheme, theme),
    [colorScheme, theme],
  )

  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) {
      return
    }

    const ctx = ref.current.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.resetTransform()
    ctx.scale(highResScaleFactor, highResScaleFactor)
    ctx.clearRect(0, 0, blockSize, blockSize)
    ctx.translate(-offsetX, rowHeight / 2 - offsetY)
    ctx.textAlign = 'center'
    ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

    const leaves = hierarchy.leaves()
    const b = blockSize

    // slice vertical rows, e.g. tree leaves, avoid negative slice
    const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
    const yEnd = Math.max(0, Math.ceil((offsetY + b + rowHeight) / rowHeight))

    // slice horizontal visible letters, avoid negative slice
    const xStart = Math.max(0, Math.floor(offsetX / colWidth))
    const xEnd = Math.max(0, Math.ceil((offsetX + b) / colWidth))
    const visibleLeaves = leaves.slice(yStart, yEnd)
    visibleLeaves.forEach(node => {
      const {
        //@ts-expect-error
        x: y,
        data: { name },
      } = node

      const str = columns[name]?.slice(xStart, xEnd)
      for (let i = 0; i < str?.length; i++) {
        const letter = str[i]
        const color =
          colorSchemeName === 'clustalx_protein_dynamic'
            ? getClustalXColor(colStats[xStart + i], model, name, xStart + i)
            : colorSchemeName === 'percent_identity_dynamic'
            ? getPercentIdentityColor(
                colStats[xStart + i],
                model,
                name,
                xStart + i,
              )
            : colorScheme[letter.toUpperCase()]
        if (bgColor) {
          const x = i * colWidth + offsetX - (offsetX % colWidth)
          ctx.fillStyle = color || 'white'
          ctx.fillRect(x, y - rowHeight, colWidth, rowHeight)
        }
      }
    })

    if (rowHeight >= 10 && colWidth >= rowHeight / 2) {
      visibleLeaves.forEach(node => {
        const {
          //@ts-expect-error
          x: y,
          data: { name },
        } = node

        const str = columns[name]?.slice(xStart, xEnd)
        for (let i = 0; i < str?.length; i++) {
          const letter = str[i]
          const color = colorScheme[letter.toUpperCase()]
          const contrast = contrastScheme[letter.toUpperCase()] || 'black'
          const x = i * colWidth + offsetX - (offsetX % colWidth)

          //note: -rowHeight/4 matches +rowHeight/4 in tree
          ctx.fillStyle = bgColor ? contrast : color || 'black'
          ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4)
        }
      })
    }
  }, [
    MSA,
    highResScaleFactor,
    columns,
    colorScheme,
    contrastScheme,
    bgColor,
    rowHeight,
    colWidth,
    hierarchy,
    offsetX,
    offsetY,
    blockSize,
  ])
  return (
    <canvas
      ref={ref}
      onMouseMove={event => {
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
      width={blockSize * highResScaleFactor}
      height={blockSize * highResScaleFactor}
      style={{
        position: 'absolute',
        top: scrollY + offsetY,
        left: scrollX + offsetX,
        width: blockSize,
        height: blockSize,
      }}
    />
  )
})

const MSACanvas = observer(function ({ model }: { model: MsaViewModel }) {
  const { MSA, msaFilehandle, height, msaAreaWidth, blocks2d } = model
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
        blocks2d.map(([bx, by]) => (
          <MSABlock
            key={`${bx}_${by}`}
            model={model}
            offsetX={bx}
            offsetY={by}
          />
        ))
      )}
    </div>
  )
})

export default MSACanvas
