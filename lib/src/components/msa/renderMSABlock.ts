// locals
import { MsaViewModel } from '../../model'
import { getClustalXColor, getPercentIdentityColor } from '../../colorSchemes'
import { HierarchyNode } from 'd3-hierarchy'
import { Theme } from '@mui/material'
import { Application, BitmapText } from 'pixi.js'
import { NodeWithIdsAndLength } from '../../types'

export function renderMSABlock({
  model,
  app,
  contrastScheme,
  theme,
}: {
  theme: Theme
  model: MsaViewModel
  contrastScheme: Record<string, string>
  app: Application
}) {
  const {
    hierarchy,
    msaAreaWidth,
    scrollX,
    scrollY,
    colWidth,
    blockSize,
    height,
    rowHeight,
    highResScaleFactor,
  } = model
  const offsetX = scrollX
  const offsetY = scrollY
  const k = highResScaleFactor
  const bx = msaAreaWidth
  const by = height
  const leaves = hierarchy.leaves()

  const yStart = Math.max(0, Math.floor((offsetY - rowHeight) / rowHeight))
  const yEnd = Math.max(0, Math.ceil((offsetY + by + rowHeight) / rowHeight))
  const xStart = Math.max(0, Math.floor(offsetX / colWidth))
  const xEnd = Math.max(0, Math.ceil((offsetX + bx) / colWidth))
  const visibleLeaves = leaves.slice(yStart, yEnd)

  drawTiles({
    model,
    app,
    theme,
    offsetX,
    offsetY,
    xStart,
    xEnd,
    visibleLeaves,
  })
  drawText({
    model,
    app,
    offsetX,
    contrastScheme,
    theme,
    xStart,
    xEnd,
    visibleLeaves,
  })
}

function drawTiles({
  model,
  offsetX,
  app,
  visibleLeaves,
  theme,
  xStart,
  xEnd,
}: {
  model: MsaViewModel
  offsetX: number
  theme: Theme
  offsetY: number
  app: Application
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
        // ctx.fillStyle = color || theme.palette.background.default
        // ctx.fillRect(x, y - rowHeight, colWidth, rowHeight)
      }
    }
  }
}

function drawText({
  model,
  offsetX,
  contrastScheme,
  app,
  visibleLeaves,
  xStart,
  xEnd,
}: {
  offsetX: number
  model: MsaViewModel
  contrastScheme: Record<string, string>
  theme: Theme
  app: Application
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
        // ctx.fillStyle = bgColor ? contrast : color || 'black'
        // ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4)

        const t = new BitmapText({
          text: letter,
          x,
          y,
          style: {
            fontFamily: 'Arial',
            fontSize: 20,
          },
        })
        app.stage.addChild(t)
      }
    }
  }
}
