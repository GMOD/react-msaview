import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useTheme } from '@mui/material'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import RBush from 'rbush'

import TreeBranchMenu from './TreeBranchMenu'
import TreeNodeMenu from './TreeNodeMenu'
import { padding, renderTreeCanvas } from './renderTreeCanvas'

import type { MsaViewModel } from '../../model'

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
  const theme = useTheme()
  const ref = useRef<HTMLCanvasElement>(null)
  const clickMap = useRef(new RBush<ClickEntry>())
  const mouseoverRef = useRef<HTMLCanvasElement>(null)
  const [branchMenu, setBranchMenu] = useState<TooltipData>()
  const [toggleNodeMenu, setToggleNodeMenu] = useState<TooltipData>()
  const [hoverElt, setHoverElt] = useState<ClickEntry>()

  const { scrollY, treeAreaWidth, blockSize, highResScaleFactor } = model

  const width = treeAreaWidth + padding
  const height = blockSize
  const w2 = width * highResScaleFactor
  const h2 = height * highResScaleFactor

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  const vref = useCallback(
    (arg: HTMLCanvasElement) => {
      model.incrementRef()
      ref.current = arg
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, height, width],
  )
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) {
      return
    }

    return autorun(() => {
      ctx.resetTransform()
      ctx.clearRect(
        0,
        0,
        (treeAreaWidth + padding) * highResScaleFactor,
        blockSize * highResScaleFactor,
      )
      renderTreeCanvas({
        ctx,
        model,
        offsetY,
        clickMap: clickMap.current,
        theme,
      })
    })
  }, [model, blockSize, highResScaleFactor, treeAreaWidth, offsetY, theme])

  useEffect(() => {
    const ctx = mouseoverRef.current?.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.resetTransform()
    ctx.clearRect(0, 0, treeAreaWidth + padding, blockSize)
    ctx.translate(0, -offsetY)

    // Highlight tree element being directly hovered
    if (hoverElt) {
      const { minX, maxX, minY, maxY } = hoverElt

      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
    }
  }, [hoverElt, offsetY, blockSize, treeAreaWidth])

  function hoverBranchClickMap(event: React.MouseEvent) {
    const x = event.nativeEvent.offsetX
    const y = event.nativeEvent.offsetY

    const [entry] = clickMap.current.search({
      minX: x,
      maxX: x + 1,
      minY: y + offsetY,
      maxY: y + 1 + offsetY,
    })

    return entry?.branch
      ? { ...entry, x: event.clientX, y: event.clientY }
      : undefined
  }

  function hoverNameClickMap(event: React.MouseEvent) {
    const x = event.nativeEvent.offsetX
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
  const style = {
    width,
    height,
    top: scrollY + offsetY,
    left: 0,
    position: 'absolute',
  } as const
  return (
    <>
      {branchMenu?.id ? (
        <TreeBranchMenu
          node={branchMenu}
          model={model}
          onClose={() => {
            setBranchMenu(undefined)
          }}
        />
      ) : null}

      {toggleNodeMenu?.id ? (
        <TreeNodeMenu
          node={toggleNodeMenu}
          model={model}
          onClose={() => {
            setToggleNodeMenu(undefined)
          }}
        />
      ) : null}

      <canvas
        width={w2}
        height={h2}
        style={style}
        onMouseMove={event => {
          if (!ref.current) {
            return
          }

          const ret = hoverNameClickMap(event) || hoverBranchClickMap(event)
          ref.current.style.cursor = ret ? 'pointer' : 'default'
          const hoveredNode = hoverNameClickMap(event)
          setHoverElt(hoveredNode)
          
          // Sync with MSA: when hovering over a tree node, highlight corresponding MSA row
          if (hoveredNode && hoveredNode.name) {
            const rowIndex = model.rowNamesSet.get(hoveredNode.name)
            if (rowIndex !== undefined) {
              model.setMousePos(undefined, rowIndex)
            }
          } else {
            // Clear MSA highlight when not hovering over a tree node
            model.setMousePos(undefined, undefined)
          }
        }}
        onClick={event => {
          const { clientX: x, clientY: y } = event

          const data = hoverBranchClickMap(event)
          if (data?.id) {
            setBranchMenu({ x, y, id: data.id, name: data.name })
          }

          const data2 = hoverNameClickMap(event)
          if (data2?.id) {
            setToggleNodeMenu({ ...data2, x, y })
          }
        }}
        onMouseLeave={() => {
          setHoverElt(undefined)
          // Clear MSA highlight when leaving tree area
          model.setMousePos(undefined, undefined)
        }}
        ref={vref}
      />
      <canvas
        style={{
          ...style,
          pointerEvents: 'none',
          zIndex: 100,
        }}
        width={width}
        height={height}
        ref={mouseoverRef}
      />
    </>
  )
})

export default TreeCanvasBlock
