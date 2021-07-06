import React, { useEffect, useRef, useState } from 'react'
import { Menu, MenuItem } from '@material-ui/core'
import normalizeWheel from 'normalize-wheel'
import { observer } from 'mobx-react'
import copy from 'copy-to-clipboard'
import RBush from 'rbush'
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

type ClickMap = { [key: string]: { id: string; name: string } }
interface TooltipData {
  name: string
  id: string
  x: number
  y: number
}

const TreeBlock = observer(
  ({ model, offsetY }: { model: MsaViewModel; offsetY: number }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const clickMap = useRef(new RBush())
    const collapseBranchMenuRef = useRef<HTMLDivElement>(null)
    const toggleNodeMenuRef = useRef<HTMLDivElement>(null)
    const mouseoverRef = useRef<HTMLCanvasElement>(null)
    const [collapsedClickMap, setCollapsedClickMap] = useState<ClickMap>({})
    const [nameClickMap, setNameClickMap] = useState<ClickMap>({})
    const [collapseBranchMenu, setCollapseBranchMenu] = useState<TooltipData>()
    const [toggleNodeMenu, setToggleNodeMenu] = useState<TooltipData>()
    const [hoverElt, setHoverElt] = useState<any>()

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
      structures,
    } = model

    useEffect(() => {
      clickMap.current.clear()

      if (!ref.current) {
        return
      }
      const ctx = ref.current.getContext('2d')
      if (!ctx) {
        return
      }

      const tempCollapsedClickMap: ClickMap = {}
      const tempNameClickMap: ClickMap = {}
      ctx.resetTransform()
      ctx.clearRect(0, 0, treeWidth + padding, blockSize)
      ctx.translate(margin.left, -offsetY)

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
          //1d line intersection to check if line crosses block at all, this is
          //an optimization that allows us to skip drawing most tree links
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

              clickMap.current.insert({
                minX: x - radius,
                maxX: x - radius + d,
                minY: y - radius,
                maxY: y - radius + d,
                id,
                name,
              })
            }
          })
        }
      }

      if (rowHeight >= 10) {
        if (labelsAlignRight) {
          ctx.textAlign = 'right'
          ctx.setLineDash([1, 3])
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

            const col = randomColor()
            tempNameClickMap[`${col}`] = { id: name, name }

            const { width } = ctx.measureText(name)
            const height = ctx.measureText('M').width // use an 'em' for height

            const hasStructure = structures[name]
            ctx.fillStyle = hasStructure ? 'blue' : 'black'

            if (!drawTree && !labelsAlignRight) {
              ctx.fillText(name, 0, yp)
              clickMap.current.insert({
                minX: 0,
                maxX: width,
                minY: yp - height,
                maxY: yp,
              })
            } else if (labelsAlignRight) {
              if (drawTree && !noTree) {
                const { width } = ctx.measureText(name)
                ctx.moveTo(xp + radius + 2, y)
                ctx.lineTo(treeAreaWidth - margin.left * 2 - width - 2, y)
                ctx.stroke()
              }
              ctx.fillText(name, treeAreaWidth - margin.left * 2, yp)
              clickMap.current.insert({
                minX: treeAreaWidth - 30 - width,
                maxX: treeAreaWidth - 30,
                minY: yp - height,
                maxY: yp,
              })
            } else {
              ctx.fillText(name, xp + d, yp)
              clickMap.current.insert({
                minX: xp + d,
                maxX: xp + d + width,
                minY: yp - height,
                maxY: yp,
              })
            }
          }
        })
        ctx.setLineDash([])
      }
      setCollapsedClickMap(tempCollapsedClickMap)
      setNameClickMap(tempNameClickMap)
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
      structures,
    ])

    useEffect(() => {
      const canvas = mouseoverRef.current
      if (!canvas) {
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      ctx.resetTransform()
      ctx.clearRect(0, 0, treeWidth + padding, blockSize)
      ctx.translate(margin.left / 2, -offsetY)

      if (hoverElt) {
        const { minX, maxX, minY, maxY } = hoverElt

        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
      }
    }, [hoverElt, margin.left, offsetY, blockSize, treeWidth])

    function hoverCollapsedClickMap(event: React.MouseEvent) {
      const x = event.nativeEvent.offsetX
      const y = event.nativeEvent.offsetY
      const entry = clickMap.current.search({
        minX: x,
        maxX: x + 1,
        minY: y,
        maxY: y + 1,
      })

      return entry.length ? { ...entry[0], x, y } : undefined
    }

    function hoverNameClickMap(event: React.MouseEvent) {
      const x = event.nativeEvent.offsetX
      const y = event.nativeEvent.offsetY
      const entry = clickMap.current.search({
        minX: x,
        maxX: x + 1,
        minY: y,
        maxY: y + 1,
      })

      return entry.length ? { ...entry[0], x, y } : undefined
    }

    function handleCloseBranchMenu() {
      setCollapseBranchMenu(undefined)
    }

    function handleCloseToggleMenu() {
      setToggleNodeMenu(undefined)
    }
    return (
      <>
        <div
          ref={collapseBranchMenuRef}
          style={{
            position: 'absolute',
            left: collapseBranchMenu?.x || 0,
            top: scrollY + offsetY + (collapseBranchMenu?.y || 0),
          }}
        />
        <div
          ref={toggleNodeMenuRef}
          style={{
            position: 'absolute',
            left: toggleNodeMenu?.x || 0,
            top: scrollY + offsetY + (toggleNodeMenu?.y || 0),
          }}
        />

        {collapseBranchMenu?.id ? (
          <Menu
            anchorEl={collapseBranchMenuRef.current}
            transitionDuration={0}
            keepMounted
            open={Boolean(collapseBranchMenuRef.current)}
            onClose={handleCloseBranchMenu}
          >
            <MenuItem dense disabled>
              {collapseBranchMenu.name}
            </MenuItem>
            <MenuItem
              dense
              onClick={() => {
                model.toggleCollapsed(collapseBranchMenu.id)
                handleCloseBranchMenu()
              }}
            >
              {model.collapsed.includes(collapseBranchMenu.id)
                ? 'Expand'
                : 'Collapse'}
            </MenuItem>
          </Menu>
        ) : null}

        {toggleNodeMenu?.id ? (
          <Menu
            anchorEl={toggleNodeMenuRef.current}
            transitionDuration={0}
            keepMounted
            open={Boolean(toggleNodeMenuRef.current)}
            onClose={handleCloseToggleMenu}
          >
            {structures[toggleNodeMenu.id]?.map((entry) => {
              const found = model.selectedStructures.find(
                (node) => node.id === toggleNodeMenu.id,
              )
              return !found ? (
                <MenuItem
                  key={JSON.stringify(entry)}
                  dense
                  onClick={() => {
                    model.addStructureToSelection({
                      structure: entry,
                      id: toggleNodeMenu.id,
                    })
                    handleCloseToggleMenu()
                  }}
                >
                  Add {entry.pdb} selection
                </MenuItem>
              ) : (
                <MenuItem
                  key={JSON.stringify(entry)}
                  dense
                  onClick={() => {
                    model.removeStructureFromSelection({
                      structure: entry,
                      id: toggleNodeMenu.id,
                    })
                    handleCloseToggleMenu()
                  }}
                >
                  Remove {entry.pdb} selection
                </MenuItem>
              )
            })}
            <MenuItem
              dense
              onClick={() => {
                copy(toggleNodeMenu.id)
                handleCloseToggleMenu()
              }}
            >
              Copy name to clipboard
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

            const ret =
              hoverNameClickMap(event) || hoverCollapsedClickMap(event)
            if (ret) {
              ref.current.style.cursor = 'pointer'
            } else {
              ref.current.style.cursor = 'default'
            }

            setHoverElt(hoverNameClickMap(event))
          }}
          onClick={(event) => {
            const data = hoverCollapsedClickMap(event)
            if (data?.id) {
              setCollapseBranchMenu(data)
            }

            const data2 = hoverNameClickMap(event)
            if (data2?.id) {
              setToggleNodeMenu(data2)
            }
          }}
          ref={ref}
        />
        <canvas
          style={{
            width: treeWidth + padding,
            height: blockSize,
            top: scrollY + offsetY,
            left: 0,
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100,
          }}
          width={treeWidth + padding}
          height={blockSize}
          ref={mouseoverRef}
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
