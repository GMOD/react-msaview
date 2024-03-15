// locals
import { MsaViewModel } from '../../model'
import { getClustalXColor, getPercentIdentityColor } from '../../colorSchemes'
import { NodeWithIdsAndLength } from '../../util'
import { HierarchyNode } from 'd3-hierarchy'
import { Theme } from '@mui/material'

export function renderBoxFeatureCanvasBlock({
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
  const xStart = Math.max(0, Math.floor(offsetX / colWidth))
  const xEnd = Math.max(0, Math.ceil((offsetX + bx) / colWidth))
  const visibleLeaves = leaves.slice(yStart, yEnd)

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
  // drawText({
  //   model,
  //   ctx,
  //   offsetX,
  //   contrastScheme,
  //   theme,
  //   xStart,
  //   xEnd,
  //   visibleLeaves,
  // })
}

function drawTiles({
  model,
  offsetX,
  ctx,
  visibleLeaves,
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
  const { interProTerms, colWidth, rowHeight, loadedIntroProAnnotations } =
    model

  for (const node of visibleLeaves) {
    const {
      // @ts-expect-error
      x: y,
      data: { name },
    } = node

    const str = loadedIntroProAnnotations?.[name]

    let j = 0
    if (str) {
      for (const m of str.matches) {
        console.log(m.locations)
        for (const l of m.locations.sort((a, b) => {
          const l1 = a.end - a.start
          const l2 = b.end - b.start
          return l1 - l2
        })) {
          for (let i = l.start - 1; i < l.end; i++) {
            const x = i * colWidth - offsetX
            ctx.fillStyle = 'rgba(255,0,0,0.3)'
            ctx.fillRect(x, y - rowHeight + j * 2, colWidth, 2)
          }
          j++
        }
      }
    }
  }
}

// function drawText({
//   model,
//   offsetX,
//   contrastScheme,
//   ctx,
//   visibleLeaves,
//   xStart,
//   xEnd,
// }: {
//   offsetX: number
//   model: MsaViewModel
//   contrastScheme: Record<string, string>
//   theme: Theme
//   ctx: CanvasRenderingContext2D
//   visibleLeaves: HierarchyNode<NodeWithIdsAndLength>[]
//   xStart: number
//   xEnd: number
// }) {
//   const { bgColor, colorScheme, columns, colWidth, rowHeight } = model
//   if (rowHeight >= 5 && colWidth > rowHeight / 2) {
//     for (const node of visibleLeaves) {
//       const {
//         // @ts-expect-error
//         x: y,
//         data: { name },
//       } = node
//       const str = columns[name]?.slice(xStart, xEnd)
//       for (let i = 0; i < str?.length; i++) {
//         const letter = str[i]
//         const color = colorScheme[letter.toUpperCase()]
//         const contrast = contrastScheme[letter.toUpperCase()] || 'black'
//         const x = i * colWidth + offsetX - (offsetX % colWidth)

//         // note: -rowHeight/4 matches +rowHeight/4 in tree
//         ctx.fillStyle = bgColor ? contrast : color || 'black'
//         ctx.fillText(letter, x + colWidth / 2, y - rowHeight / 4)
//       }
//     }
//   }
// }
