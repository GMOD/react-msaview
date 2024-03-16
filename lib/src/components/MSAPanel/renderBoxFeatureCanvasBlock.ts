// locals
import { MsaViewModel } from '../../model'
import { NodeWithIdsAndLength } from '../../util'
import { HierarchyNode } from 'd3-hierarchy'
import { Theme } from '@mui/material'

export function renderBoxFeatureCanvasBlock({
  model,
  offsetX,
  offsetY,
  ctx,
  theme,
  highResScaleFactorOverride,
  blockSizeXOverride,
  blockSizeYOverride,
}: {
  offsetX: number
  offsetY: number
  theme: Theme
  model: MsaViewModel
  contrastScheme: Record<string, string>
  ctx: CanvasRenderingContext2D
  highResScaleFactorOverride?: number
  blockSizeXOverride?: number
  blockSizeYOverride?: number
}) {
  const {
    hierarchy,
    colWidth,
    blockSize,
    rowHeight,
    fontSize,
    highResScaleFactor,
  } = model
  const k = highResScaleFactorOverride || highResScaleFactor
  const bx = blockSizeXOverride || blockSize
  const by = blockSizeYOverride || blockSize
  ctx.resetTransform()
  ctx.scale(k, k)
  ctx.clearRect(0, 0, bx, by)
  ctx.translate(-offsetX, rowHeight / 2 - offsetY)
  ctx.textAlign = 'center'
  ctx.font = ctx.font.replace(/\d+px/, `${fontSize}px`)

  const leaves = hierarchy.leaves()

  const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
  const yEnd = Math.max(0, Math.ceil((offsetY + by + rowHeight) / rowHeight))
  const visibleLeaves = leaves.slice(yStart, yEnd)

  drawTiles({
    model,
    ctx,
    visibleLeaves,
  })
}

function drawTiles({
  model,
  ctx,
  visibleLeaves,
}: {
  model: MsaViewModel
  ctx: CanvasRenderingContext2D
  visibleLeaves: HierarchyNode<NodeWithIdsAndLength>[]
}) {
  const {
    rows,
    interProTerms,
    colWidth,
    rowHeight,
    loadedIntroProAnnotations,
  } = model

  for (const node of visibleLeaves) {
    const {
      // @ts-expect-error
      x: y,
      data: { name },
    } = node

    const str = loadedIntroProAnnotations?.[name]
    const str2 = rows.find(f => f[0] === name)?.[1]

    let j = 0
    if (str) {
      for (const m of str.matches) {
        for (const l of m.locations.sort((a, b) => {
          const l1 = a.end - a.start
          const l2 = b.end - b.start
          return l1 - l2
        })) {
          const m1 = model.globalCoordToRowSpecificCoord2(name, l.start - 1)
          const m2 = model.globalCoordToRowSpecificCoord2(name, l.end)
          console.log({
            name,
            s: l.start,
            e: l.end,
            m1,
            m2,
            len: m2 - m1,
            w: colWidth * (m2 - m1),
            str: str2?.length,
          })
          const x = m1 * colWidth
          ctx.fillStyle = 'rgba(255,0,0,0.3)'
          ctx.fillRect(x, y - rowHeight + j * 5, colWidth * (m2 - m1), 5)
          j++
        }
      }
    }
  }
}
