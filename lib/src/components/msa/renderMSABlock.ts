
// locals
import { getClustalXColor, getPercentIdentityColor } from '../../colorSchemes'

import type { MsaViewModel } from '../../model'
import type { NodeWithIdsAndLength } from '../../util'
import type { Theme } from '@mui/material'
import type { HierarchyNode } from 'd3-hierarchy'

export function renderMSABlock({
  model,
  offsetX,
  offsetY,
  contrastScheme,
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
    colWidth,
    blockSize,
    rowHeight,
    fontSize,
    highResScaleFactor,
    actuallyShowDomains,
    leaves,
  } = model
  const k = highResScaleFactorOverride || highResScaleFactor
  const bx = blockSizeXOverride || blockSize
  const by = blockSizeYOverride || blockSize
  ctx.resetTransform()
  ctx.scale(k, k)
  ctx.translate(-offsetX, rowHeight / 2 - offsetY)
  ctx.textAlign = 'center'
  ctx.font = ctx.font.replace(/\d+px/, `${fontSize}px`)

  const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
  const yEnd = Math.max(0, Math.ceil((offsetY + by + rowHeight) / rowHeight))
  const xStart = Math.max(0, Math.floor(offsetX / colWidth))
  const xEnd = Math.max(0, Math.ceil((offsetX + bx) / colWidth))
  const visibleLeaves = leaves.slice(yStart, yEnd)

  if (!actuallyShowDomains) {
    drawTiles({
      model,
      ctx,
      theme,
      offsetX,
      offsetY,
      xStart,
      xEnd,
      visibleLeaves,
    })
  }
  drawText({
    model,
    ctx,
    offsetX,
    contrastScheme,
    theme,
    xStart,
    xEnd,
    visibleLeaves,
  })
  ctx.resetTransform()
}

function drawTiles({
  model,
  offsetX,
  ctx,
  visibleLeaves,
  theme,
  xStart,
  xEnd,
}: {
  model: MsaViewModel
  offsetX: number
  theme: Theme
  offsetY: number
  ctx: CanvasRenderingContext2D
  visibleLeaves: HierarchyNode<NodeWithIdsAndLength>[]
  xStart: number
  xEnd: number
}) {
  const {
    bgColor,
    colorSchemeName,
    colorScheme,
    columns,
    colWidth,
    rowHeight,
  } = model

  for (const node of visibleLeaves) {
    const {
      data: { name },
    } = node
    const y = node.x!
    const str = columns[name]?.slice(xStart, xEnd)
    if (str) {
      for (let i = 0; i < str.length; i++) {
        const letter = str[i]!
        const color =
          colorSchemeName === 'clustalx_protein_dynamic'
            ? getClustalXColor(
                // use model.colStats dot notation here: delay use of colStats
                // until absolutely needed
                model.colStats[xStart + i]!,
                model.colStatsSums[xStart + i]!,
                model,
                name,
                xStart + i,
              )
            : colorSchemeName === 'percent_identity_dynamic'
              ? getPercentIdentityColor(
                  // use model.colStats dot notation here: delay use of
                  // colStats until absolutely needed
                  model.colStats[xStart + i]!,
                  model.colStatsSums[xStart + i]!,
                  model,
                  name,
                  xStart + i,
                )
              : colorScheme[letter.toUpperCase()]
        if (bgColor) {
          ctx.fillStyle = color || theme.palette.background.default
          ctx.fillRect(
            i * colWidth + offsetX - (offsetX % colWidth),
            y - rowHeight,
            colWidth,
            rowHeight,
          )
        }
      }
    }
  }
}

function drawText({
  model,
  offsetX,
  contrastScheme,
  ctx,
  visibleLeaves,
  xStart,
  xEnd,
}: {
  offsetX: number
  model: MsaViewModel
  contrastScheme: Record<string, string>
  theme: Theme
  ctx: CanvasRenderingContext2D
  visibleLeaves: HierarchyNode<NodeWithIdsAndLength>[]
  xStart: number
  xEnd: number
}) {
  const {
    bgColor,
    actuallyShowDomains,
    showMsaLetters,
    colorScheme,
    columns,
    colWidth,
    contrastLettering,
    rowHeight,
  } = model
  if (showMsaLetters) {
    for (const node of visibleLeaves) {
      const {
        data: { name },
      } = node
      const y = node.x!
      const str = columns[name]?.slice(xStart, xEnd)
      if (str) {
        for (let i = 0; i < str.length; i++) {
          const letter = str[i]!
          const color = colorScheme[letter.toUpperCase()]
          const contrast = contrastLettering
            ? contrastScheme[letter.toUpperCase()] || 'black'
            : 'black'
          const x = i * colWidth + offsetX - (offsetX % colWidth)

          // note: -rowHeight/4 matches +rowHeight/4 in tree
          ctx.fillStyle = actuallyShowDomains
            ? 'black'
            : bgColor
              ? contrast
              : color || 'black'
          ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4)
        }
      }
    }
  }
}
