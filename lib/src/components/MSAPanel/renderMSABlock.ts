// locals
import { MsaViewModel } from '../../model'
import { getClustalXColor, getPercentIdentityColor } from '../../colorSchemes'

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
    bgColor,
    colorSchemeName,
    colorScheme,
    colStats,
    columns,
    blockSize,
    colWidth,
    rowHeight,
    highResScaleFactor,
  } = model
  ctx.resetTransform()
  ctx.scale(highResScaleFactor, highResScaleFactor)
  ctx.clearRect(0, 0, blockSize, blockSize)
  ctx.translate(-offsetX, rowHeight / 2 - offsetY)
  ctx.textAlign = 'center'
  ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

  const leaves = hierarchy.leaves()
  const b = blockSize

  // slice vertical rows, e.g. tree leaves, avoid negative slice
  const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
  const yEnd = Math.max(0, Math.ceil((offsetY + b + rowHeight) / rowHeight))

  // slice horizontal visible letters, avoid negative slice
  const xStart = Math.max(0, Math.floor(offsetX / colWidth))
  const xEnd = Math.max(0, Math.ceil((offsetX + b) / colWidth))
  const visibleLeaves = leaves.slice(yStart, yEnd)
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
