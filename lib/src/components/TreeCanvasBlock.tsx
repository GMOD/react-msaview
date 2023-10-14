import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import RBush from 'rbush'

// locals
import { MsaViewModel } from '../model'
import TreeMenu from './TreeMenu'
import TreeBranchMenu from './TreeBranchMenu'

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

const TreeCanvasBlock = observer(function ({
  model,
  offsetY,
}: {
  model: MsaViewModel
  offsetY: number
}) {
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
      for (const { source, target } of hierarchy.links()) {
        const y = showBranchLen ? 'len' : 'y'
        // @ts-expect-error
        const { x: sy, [y]: sx } = source
        // @ts-expect-error
        const { x: ty, [y]: tx } = target

        const y1 = Math.min(sy, ty)
        const y2 = Math.max(sy, ty)
        // 1d line intersection to check if line crosses block at all, this is
        // an optimization that allows us to skip drawing most tree links
        // outside the block
        if (offsetY + blockSize >= y1 && y2 >= offsetY) {
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(sx, ty)
          ctx.lineTo(tx, ty)
          ctx.stroke()
        }
      }

      if (drawNodeBubbles) {
        for (const node of hierarchy.descendants()) {
          const val = showBranchLen ? 'len' : 'y'
          const {
            // @ts-expect-error
            x: y,
            // @ts-expect-error
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
        }
      }
    }

    if (rowHeight >= 5) {
      if (labelsAlignRight) {
        ctx.textAlign = 'right'
        ctx.setLineDash([1, 3])
      } else {
        ctx.textAlign = 'start'
      }
      for (const node of hierarchy.leaves()) {
        const {
          // @ts-expect-error
          x: y,
          // @ts-expect-error
          y: x,
          data: { name, id },
          // @ts-expect-error
          len,
        } = node

        if (
          y > offsetY - extendBounds &&
          y < offsetY + blockSize + extendBounds
        ) {
          // note: +rowHeight/4 matches with -rowHeight/4 in msa
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
            const smallPadding = 2
            const offset = treeAreaWidth - smallPadding - margin.left
            if (drawTree && !noTree) {
              const { width } = ctx.measureText(name)
              ctx.moveTo(xp + radius + 2, y)
              ctx.lineTo(offset - smallPadding - width, y)
              ctx.stroke()
            }
            ctx.fillText(name, offset, yp)
            clickMap.current.insert({
              minX: treeAreaWidth - margin.left - width,
              maxX: treeAreaWidth - margin.left,
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
      }
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
    highResScaleFactor,
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
          ref.current.style.cursor = ret ? 'pointer' : 'default'
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
})

export default TreeCanvasBlock
