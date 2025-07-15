import type { MsaViewModel } from '../../model'
import type { NodeWithIdsAndLength } from '../../types'
import type { HierarchyNode } from 'd3-hierarchy'

export function renderBoxFeatureCanvasBlock({
  model,
  offsetX,
  offsetY,
  ctx,
  highResScaleFactorOverride,
  blockSizeYOverride,
}: {
  offsetX: number
  offsetY: number
  model: MsaViewModel
  ctx: CanvasRenderingContext2D
  highResScaleFactorOverride?: number
  blockSizeYOverride?: number
}) {
  const { leaves, blockSize, rowHeight, highResScaleFactor, showDomains } =
    model
  if (showDomains) {
    const k = highResScaleFactorOverride || highResScaleFactor
    const by = blockSizeYOverride || blockSize
    ctx.resetTransform()
    ctx.scale(k, k)
    ctx.translate(-offsetX, rowHeight / 2 - offsetY)

    const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
    const yEnd = Math.max(0, Math.ceil((offsetY + by + rowHeight) / rowHeight))
    const visibleLeaves = leaves.slice(yStart, yEnd)

    drawTiles({
      model,
      ctx,
      visibleLeaves,
    })
  }
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
    subFeatureRows,
    colWidth,
    rowHeight,
    fillPalette,
    strokePalette,
    tidyFilteredGatheredInterProAnnotations,
  } = model

  for (let i = 0, l1 = visibleLeaves.length; i < l1; i++) {
    const node = visibleLeaves[i]!
    const {
      x,
      data: { name },
    } = node
    const y = x!

    const entry = tidyFilteredGatheredInterProAnnotations[name]

    if (entry) {
      for (let j = 0, l2 = entry.length; j < l2; j++) {
        const { start, end, accession } = entry[j]!
        const m1 = model.seqCoordToRowSpecificGlobalCoord(name, start - 1)
        const m2 = model.seqCoordToRowSpecificGlobalCoord(name, end)
        const x = m1 * colWidth
        ctx.fillStyle = fillPalette[accession]!
        ctx.strokeStyle = strokePalette[accession]!
        const h = subFeatureRows ? 4 : rowHeight
        const t = y - rowHeight + (subFeatureRows ? j * h : 0)
        const lw = colWidth * (m2 - m1)
        ctx.fillRect(x, t, lw, h)
        ctx.strokeRect(x, t, lw, h)
      }
    }
  }
}
