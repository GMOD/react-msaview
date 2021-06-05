import React, { useEffect, useRef, useState } from 'react'
import { Menu, MenuItem } from '@material-ui/core'
import normalizeWheel from 'normalize-wheel'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

const extendBounds = 5
const radius = 3.5
const d = radius * 2

function randomColor() {
  return [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ]
}

const padding = 600

type StrMap = { [key: string]: { id: string; name: string } }
interface TooltipData {
  name: string
  id: string
  x: number
  y: number
}
const TreeBlock = observer(
  ({ model, offsetY }: { model: MsaViewModel; offsetY: number }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const clickRef = useRef<HTMLCanvasElement>(null)
    const [colorMap, setColorMap] = useState<StrMap>({})
    const [hovering, setHovering] = useState<TooltipData>()
    const {
      hierarchy,
      rowHeight,
      scrollY,
      treeWidth,
      showBranchLen,
      collapsed,
      margin,
      labelsAlignRight,
      noTree,
      blockSize,
      drawNodeBubbles,
      drawTree,
      treeAreaWidth,
    } = model

    useEffect(() => {
      if (!ref.current || !clickRef.current) {
        return
      }
      const ctx = ref.current.getContext('2d')
      const clickCtx = clickRef.current.getContext('2d')
      if (!ctx || !clickCtx) {
        return
      }
      const colorHash: StrMap = {}
      ;[ctx, clickCtx].forEach((context) => {
        context.resetTransform()
        context.clearRect(0, 0, treeWidth + padding, blockSize)
        context.translate(margin.left, -offsetY)
      })

      const font = ctx.font
      ctx.font = font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

      if (!noTree && drawTree) {
        hierarchy.links().forEach(({ source, target }) => {
          const y = showBranchLen ? 'len' : 'y'
          //@ts-ignore
          const { x: sy, [y]: sx } = source
          //@ts-ignore
          const { x: ty, [y]: tx } = target

          const y1 = Math.min(sy, ty)
          const y2 = Math.max(sy, ty)
          //1d line intersection to check if line crosses block at all, this
          //is an optimization that allows us to skip drawing most tree links
          //outside the block
          if (offsetY + blockSize >= y1 && y2 >= offsetY) {
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(sx, ty)
            ctx.lineTo(tx, ty)
            ctx.stroke()
          }
        })

        if (drawNodeBubbles) {
          hierarchy.descendants().forEach((node) => {
            const val = showBranchLen ? 'len' : 'y'
            const {
              //@ts-ignore
              x: y,
              //@ts-ignore
              [val]: x,
              data,
            } = node
            const { id = '', name = '' } = data

            if (
              y > offsetY - extendBounds &&
              y < offsetY + blockSize + extendBounds
            ) {
              ctx.strokeStyle = 'black'
              ctx.fillStyle = collapsed.includes(id) ? 'black' : 'white'
              ctx.beginPath()
              ctx.arc(x, y, radius, 0, 2 * Math.PI)
              ctx.fill()
              ctx.stroke()

              const col = randomColor()
              const [r, g, b] = col
              colorHash[`${col}`] = { id, name }

              clickCtx.fillStyle = `rgb(${r},${g},${b})`
              clickCtx.fillRect(x - radius, y - radius, d, d)
            }
          })
        }
      }

      if (rowHeight >= 10) {
        ctx.fillStyle = 'black'

        if (labelsAlignRight) {
          ctx.textAlign = 'end'
          ctx.setLineDash([3, 5])
        } else {
          ctx.textAlign = 'start'
        }
        hierarchy.leaves().forEach((node) => {
          const {
            //@ts-ignore
            x: y,
            //@ts-ignore
            y: x,
            data: { name },
            //@ts-ignore
            len,
          } = node
          if (
            y > offsetY - extendBounds &&
            y < offsetY + blockSize + extendBounds
          ) {
            //note: +rowHeight/4 matches with -rowHeight/4 in msa
            const yp = y + rowHeight / 4
            const xp = showBranchLen ? len : x
            if (!drawTree && !labelsAlignRight) {
              ctx.fillText(name, 0, yp)
            } else if (labelsAlignRight) {
              if (drawTree) {
                const { width } = ctx.measureText(name)
                ctx.moveTo(xp + radius + 2, y)
                ctx.lineTo(treeAreaWidth - 30 - width, y)
                ctx.stroke()
              }
              ctx.fillText(name, treeAreaWidth - 30, yp)
            } else {
              ctx.fillText(name, xp + d, yp)
            }
          }
        })
        ctx.setLineDash([])
      }
      setColorMap(colorHash)
    }, [
      collapsed,
      rowHeight,
      margin.left,
      hierarchy,
      offsetY,
      treeWidth,
      showBranchLen,
      noTree,
      blockSize,
      drawNodeBubbles,
      drawTree,
      labelsAlignRight,
      treeAreaWidth,
    ])

    function decode(event: React.MouseEvent) {
      const x = event.nativeEvent.offsetX
      const y = event.nativeEvent.offsetY
      if (!clickRef.current) {
        return
      }
      const clickCtx = clickRef.current.getContext('2d')
      if (!clickCtx) {
        return
      }
      const { data } = clickCtx.getImageData(x, y, 1, 1)

      const col = [data[0], data[1], data[2]]
      return { ...colorMap[`${col}`], x, y }
    }
    function handleClose() {
      setHovering(undefined)
    }
    return (
      <>
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            left: hovering?.x || 0,
            top: scrollY + offsetY + (hovering?.y || 0),
          }}
        />
        {hovering && hovering.id ? (
          <Menu
            anchorEl={menuRef.current}
            transitionDuration={0}
            keepMounted
            open={Boolean(menuRef.current)}
            onClose={handleClose}
          >
            <MenuItem
              dense
              onClick={() => {
                model.toggleCollapsed(hovering.id)
                handleClose()
              }}
            >
              {model.collapsed.includes(hovering.id) ? 'Expand' : 'Collapse'}
            </MenuItem>
          </Menu>
        ) : null}
        <canvas
          width={treeWidth + padding}
          height={blockSize}
          style={{
            width: treeWidth + padding,
            height: blockSize,
            top: scrollY + offsetY,
            left: 0,
            position: 'absolute',
          }}
          onMouseMove={(event) => {
            if (!ref.current) {
              return
            }
            const data = decode(event)
            if (data) {
              if (data.id) {
                ref.current.style.cursor = 'pointer'
              } else {
                ref.current.style.cursor = 'default'
              }
            }
          }}
          onClick={(event) => {
            const data = decode(event)
            if (data && data.id) {
              setHovering(data)
            }
          }}
          ref={ref}
        />
        <canvas
          style={{ display: 'none' }}
          width={treeWidth + padding}
          height={blockSize}
          ref={clickRef}
        />
      </>
    )
  },
)
const TreeCanvas = observer(({ model }: { model: MsaViewModel }) => {
  const ref = useRef<HTMLDivElement>(null)
  const scheduled = useRef(false)
  const deltaY = useRef(0)
  const prevY = useRef<number>(0)
  const { treeWidth, height, blocksY } = model
  const [mouseDragging, setMouseDragging] = useState(false)

  useEffect(() => {
    const curr = ref.current
    if (!curr) {
      return
    }
    function onWheel(origEvent: WheelEvent) {
      const event = normalizeWheel(origEvent)
      deltaY.current += event.pixelY

      if (!scheduled.current) {
        scheduled.current = true
        requestAnimationFrame(() => {
          model.doScrollY(-deltaY.current)
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
      const currY = event.clientY
      const distanceY = currY - prevY.current
      if (distanceY) {
        // use rAF to make it so multiple event handlers aren't fired per-frame
        // see https://calendar.perfplanet.com/2013/the-runtime-performance-checklist/
        if (!scheduled.current) {
          scheduled.current = true
          window.requestAnimationFrame(() => {
            model.doScrollY(distanceY)
            scheduled.current = false
            prevY.current = event.clientY
          })
        }
      }
    }

    function globalMouseUp() {
      prevY.current = 0
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

  function mouseDown(event: React.MouseEvent) {
    // check if clicking a draggable element or a resize handle
    const target = event.target as HTMLElement
    if (target.draggable || target.dataset.resizer) {
      return
    }

    // otherwise do click and drag scroll
    if (event.button === 0) {
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

  return (
    <div
      ref={ref}
      onMouseDown={mouseDown}
      onMouseUp={mouseUp}
      onMouseLeave={mouseLeave}
      style={{
        height,
        position: 'relative',
        overflow: 'hidden',
        width: treeWidth + padding,
      }}
    >
      {blocksY.map((block) => (
        <TreeBlock key={block} model={model} offsetY={block} />
      ))}
    </div>
  )
})

export default TreeCanvas
