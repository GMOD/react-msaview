import React, { useEffect, useRef, useState } from 'react'
import { Menu, MenuItem } from '@material-ui/core'
import normalizeWheel from 'normalize-wheel'
import { observer } from 'mobx-react'
import RBush from 'rbush'
import { MsaViewModel } from '../model'
import MoreInfoDlg from './MoreInfoDlg'

const extendBounds = 5
const radius = 3.5
const d = radius * 2

const padding = 600

interface TooltipData {
  name: string
  id: string
  x: number
  y: number
}

interface ClickEntry {
  name: string
  id: string
  branch?: boolean
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const TreeMenu = observer(
  ({
    node,
    onClose,
    model,
  }: {
    node: { x: number; y: number; name: string }
    model: MsaViewModel
    onClose: () => void
  }) => {
    const { structures } = model
    const nodeDetails = node ? model.getRowDetails(node.name) : undefined
    console.log({ nodeDetails })

    return (
      <>
        <Menu
          anchorReference="anchorPosition"
          anchorPosition={{
            top: node.y,
            left: node.x,
          }}
          transitionDuration={0}
          keepMounted
          open={Boolean(node)}
          onClose={onClose}
        >
          <MenuItem dense disabled>
            {node.name}
          </MenuItem>

          <MenuItem
            dense
            onClick={() => {
              model.setDialogComponent(MoreInfoDlg, {
                info: model.getRowDetails(node.name),
              })
              onClose()
            }}
          >
            More info...
          </MenuItem>

          {structures[node.name]?.map(entry => {
            return !model.selectedStructures.find(n => n.id === node.name) ? (
              <MenuItem
                key={JSON.stringify(entry)}
                dense
                onClick={() => {
                  model.addStructureToSelection({
                    structure: entry,
                    id: node.name,
                  })
                  onClose()
                }}
              >
                Add PDB to selection ({entry.pdb})
              </MenuItem>
            ) : (
              <MenuItem
                key={JSON.stringify(entry)}
                dense
                onClick={() => {
                  model.removeStructureFromSelection({
                    structure: entry,
                    id: node.name,
                  })
                  onClose()
                }}
              >
                Remove PDB from selection ({entry.pdb})
              </MenuItem>
            )
          })}

          {nodeDetails.accession?.map(accession => (
            <MenuItem
              dense
              key={accession}
              onClick={() => {
                model.addUniprotTrack({ name: nodeDetails.name, accession })
                onClose()
              }}
            >
              Open UniProt track ({accession})
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  },
)

const TreeBranchMenu = observer(
  ({
    node,
    model,
    onClose,
  }: {
    node: { x: number; y: number; name: string; id: string }
    model: MsaViewModel
    onClose: () => void
  }) => {
    return (
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={{
          left: node.x,
          top: node.y,
        }}
        transitionDuration={0}
        keepMounted
        open={Boolean(node)}
        onClose={onClose}
      >
        <MenuItem dense disabled>
          {node.name}
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            model.toggleCollapsed(node.id)
            onClose()
          }}
        >
          {model.collapsed.includes(node.id) ? 'Expand' : 'Collapse'}
        </MenuItem>
      </Menu>
    )
  },
)

const TreeBlock = observer(
  ({ model, offsetY }: { model: MsaViewModel; offsetY: number }) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const clickMap = useRef(new RBush<ClickEntry>())
    const mouseoverRef = useRef<HTMLCanvasElement>(null)
    const [branchMenu, setBranchMenu] = useState<TooltipData>()
    const [toggleNodeMenu, setToggleNodeMenu] = useState<TooltipData>()
    const [hoverElt, setHoverElt] = useState<ClickEntry>()

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
      highResScaleFactor,
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

      ctx.resetTransform()
      ctx.scale(highResScaleFactor, highResScaleFactor)
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
          hierarchy.descendants().forEach(node => {
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
                branch: true,
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
        hierarchy.leaves().forEach(node => {
          const {
            //@ts-ignore
            x: y,
            //@ts-ignore
            y: x,
            data: { name, id },
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
                name,
                id,
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
                name,
                id,
              })
            } else {
              ctx.fillText(name, xp + d, yp)
              clickMap.current.insert({
                minX: xp + d,
                maxX: xp + d + width,
                minY: yp - height,
                maxY: yp,
                name,
                id,
              })
            }
          }
        })
        ctx.setLineDash([])
      }
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
      ctx.translate(margin.left, -offsetY)

      if (hoverElt) {
        const { minX, maxX, minY, maxY } = hoverElt

        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
      }
    }, [hoverElt, margin.left, offsetY, blockSize, treeWidth])

    function hoverBranchClickMap(event: React.MouseEvent) {
      const x = event.nativeEvent.offsetX - margin.left
      const y = event.nativeEvent.offsetY

      const [entry] = clickMap.current.search({
        minX: x,
        maxX: x + 1,
        minY: y + offsetY,
        maxY: y + 1 + offsetY,
      })

      return entry && entry.branch
        ? { ...entry, x: event.clientX, y: event.clientY }
        : undefined
    }

    function hoverNameClickMap(event: React.MouseEvent) {
      const x = event.nativeEvent.offsetX - margin.left
      const y = event.nativeEvent.offsetY
      const [entry] = clickMap.current.search({
        minX: x,
        maxX: x + 1,
        minY: y + offsetY,
        maxY: y + 1 + offsetY,
      })

      return entry && !entry.branch
        ? { ...entry, x: event.clientX, y: event.clientY }
        : undefined
    }

    return (
      <>
        {branchMenu?.id ? (
          <TreeBranchMenu
            node={branchMenu}
            model={model}
            onClose={() => setBranchMenu(undefined)}
          />
        ) : null}

        {toggleNodeMenu?.id ? (
          <TreeMenu
            node={toggleNodeMenu}
            model={model}
            onClose={() => setToggleNodeMenu(undefined)}
          />
        ) : null}

        <canvas
          width={(treeWidth + padding) * highResScaleFactor}
          height={blockSize * highResScaleFactor}
          style={{
            width: treeWidth + padding,
            height: blockSize,
            top: scrollY + offsetY,
            left: 0,
            position: 'absolute',
          }}
          onMouseMove={event => {
            if (!ref.current) {
              return
            }

            const ret = hoverNameClickMap(event) || hoverBranchClickMap(event)

            if (ret) {
              ref.current.style.cursor = 'pointer'
            } else {
              ref.current.style.cursor = 'default'
            }

            setHoverElt(hoverNameClickMap(event))
          }}
          onClick={event => {
            const { clientX: x, clientY: y } = event

            const data = hoverBranchClickMap(event)
            if (data?.id) {
              setBranchMenu({ ...data, x, y })
            }

            const data2 = hoverNameClickMap(event)
            if (data2?.id) {
              setToggleNodeMenu({ ...data2, x, y })
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
      {blocksY.map(block => (
        <TreeBlock key={block} model={model} offsetY={block} />
      ))}
    </div>
  )
})

export default TreeCanvas
