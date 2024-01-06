import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import RBush from 'rbush'

// locals
import { MsaViewModel } from '../../model'
import TreeMenu from './TreeMenu'
import TreeBranchMenu from './TreeBranchMenu'
import {
  renderNodeBubbles,
  renderTree,
  renderTreeLabels,
} from './renderTreeCanvas'
import { autorun } from 'mobx'

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

function drawCanvas({
  model,
  clickMap,
  ctx,
  offsetY,
}: {
  model: MsaViewModel
  offsetY: number
  ctx: CanvasRenderingContext2D
  clickMap: RBush<any>
}) {
  console.log('here')
  clickMap.clear()
  const {
    noTree,
    drawTree,
    drawNodeBubbles,
    treeWidth,
    highResScaleFactor,
    margin,
    blockSize,
    rowHeight,
  } = model

  ctx.resetTransform()
  ctx.scale(highResScaleFactor, highResScaleFactor)
  ctx.clearRect(0, 0, treeWidth + padding, blockSize)
  ctx.translate(margin.left, -offsetY)

  const font = ctx.font
  ctx.font = font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

  if (!noTree && drawTree) {
    renderTree({ ctx, offsetY, model })

    if (drawNodeBubbles) {
      renderNodeBubbles({ ctx, offsetY, clickMap, model })
    }
  }

  if (rowHeight >= 5) {
    renderTreeLabels({ ctx, offsetY, model, clickMap })
  }
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

  const { scrollY, treeWidth, margin, blockSize, highResScaleFactor } = model

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const ctx = ref.current.getContext('2d')
    if (!ctx) {
      return
    }
    return autorun(() => {
      drawCanvas({ ctx, model, offsetY, clickMap: clickMap.current })
    })
  }, [model, offsetY])

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
