// locals
import { MsaViewModel } from '../../model'
import { getClustalXColor, getPercentIdentityColor } from '../../colorSchemes'
import { NodeWithIdsAndLength } from '../../util'
import { HierarchyNode } from 'd3-hierarchy'

export function renderBlock({
  model,
  offsetX,
  offsetY,
  contrastScheme,
  ctx,
}: {
  offsetX: number
  offsetY: number
  model: MsaViewModel
  contrastScheme: Record<string, string>
  ctx: CanvasRenderingContext2D
}) {
  const {
    hierarchy,
    colWidth,
    blockSize,
    rowHeight,
    fontSize,
    highResScaleFactor,
  } = model
  ctx.resetTransform()
  ctx.scale(highResScaleFactor, highResScaleFactor)
  ctx.clearRect(0, 0, blockSize, blockSize)
  ctx.translate(-offsetX, rowHeight / 2 - offsetY)
  ctx.textAlign = 'center'
  ctx.font = ctx.font.replace(/\d+px/, `${fontSize}px`)

  const leaves = hierarchy.leaves()
  const b = blockSize

  const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
  const yEnd = Math.max(0, Math.ceil((offsetY + b + rowHeight) / rowHeight))
  const xStart = Math.max(0, Math.floor(offsetX / colWidth))
  const xEnd = Math.max(0, Math.ceil((offsetX + b) / colWidth))
  const visibleLeaves = leaves.slice(yStart, yEnd)

  drawTiles({
    model,
    ctx,
    offsetX,
    offsetY,
    xStart,
    xEnd,
    visibleLeaves,
  })
  drawText({
    model,
    ctx,
    offsetX,
    contrastScheme,
    xStart,
    xEnd,
    visibleLeaves,
  })
}

function drawTiles({
  model,
  offsetX,
  ctx,
  visibleLeaves,
  xStart,
  xEnd,
}: {
  model: MsaViewModel
  offsetX: number
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
    colStats,
    columns,
    colWidth,
    rowHeight,
  } = model

  for (const node of visibleLeaves) {
    const {
      // @ts-expect-error
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
  ctx: CanvasRenderingContext2D
  visibleLeaves: HierarchyNode<NodeWithIdsAndLength>[]
  xStart: number
  xEnd: number
}) {
  const { bgColor, colorScheme, columns, colWidth, rowHeight } = model
  if (rowHeight >= 5 && colWidth > rowHeight / 2) {
    for (const node of visibleLeaves) {
      const {
        // @ts-expect-error
        x: y,
        data: { name },
      } = node
      const str = columns[name]?.slice(xStart, xEnd)
      for (let i = 0; i < str?.length; i++) {
        const letter = str[i]
        const color = colorScheme[letter.toUpperCase()]
        const contrast = contrastScheme[letter.toUpperCase()] || 'black'
        const x = i * colWidth + offsetX - (offsetX % colWidth)

        // note: -rowHeight/4 matches +rowHeight/4 in tree
        ctx.fillStyle = bgColor ? contrast : color || 'black'
        ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4)
      }
    }
  }
}
