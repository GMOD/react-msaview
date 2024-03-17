import { colord } from 'colord'
import { HierarchyNode } from 'd3-hierarchy'

// locals
import { MsaViewModel } from '../../model'
import { NodeWithIdsAndLength } from '../../util'
import palettes from './ggplotPalettes'

export function renderBoxFeatureCanvasBlock({
  model,
  offsetX,
  offsetY,
  ctx,
  highResScaleFactorOverride,
  blockSizeXOverride,
  blockSizeYOverride,
}: {
  offsetX: number
  offsetY: number
  model: MsaViewModel
  ctx: CanvasRenderingContext2D
  highResScaleFactorOverride?: number
  blockSizeXOverride?: number
  blockSizeYOverride?: number
}) {
  const { hierarchy, blockSize, rowHeight, fontSize, highResScaleFactor } =
    model
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
  const arr = [...interProTerms.keys()]
  let i = 0
  const map = {} as Record<string, string>
  const stroke = {} as Record<string, string>
  for (const key of arr) {
    const k = Math.min(arr.length - 1, palettes.length - 1)
    map[key] = palettes[k][i]
    stroke[key] = colord(palettes[k][i]).darken(0.1).toHex()
    i++
  }

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
        if (m.signature.entry) {
          for (const l of m.locations.sort((a, b) => {
            const l1 = a.end - a.start
            const l2 = b.end - b.start
            return l1 - l2
          })) {
            const m1 = model.seqCoordToRowSpecificGlobalCoord(name, l.start - 1)
            const m2 = model.seqCoordToRowSpecificGlobalCoord(name, l.end)
            const x = m1 * colWidth
            ctx.fillStyle = map[m.signature.entry?.accession]
            ctx.strokeStyle = stroke[m.signature.entry?.accession]
            const h = 4
            ctx.fillRect(x, y - rowHeight + j * h, colWidth * (m2 - m1), h)
            ctx.strokeRect(x, y - rowHeight + j * h, colWidth * (m2 - m1), h)
            j++
          }
        }
      }
    }
  }
}
