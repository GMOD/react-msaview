import RBush from 'rbush'

// locals
import { MsaViewModel } from '../../model'

export const padding = 600
const extendBounds = 5
const radius = 3.5
const d = radius * 2

interface ClickEntry {
  name: string
  id: string
  branch?: boolean
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function renderTree({
  offsetY,
  ctx,
  model,
}: {
  offsetY: number
  ctx: CanvasRenderingContext2D
  model: MsaViewModel
}) {
  const { hierarchy, showBranchLen, blockSize } = model
  for (const { source, target } of hierarchy.links()) {
    const y = showBranchLen ? 'len' : 'y'
    // @ts-expect-error
    const { x: sy, [y]: sx } = source
    // @ts-expect-error
    const { x: ty, [y]: tx } = target

    const y1 = Math.min(sy, ty)
    const y2 = Math.max(sy, ty)
    // 1d line intersection to check if line crosses block at all, this is
    // an optimization that allows us to skip drawing most tree links
    // outside the block
    if (offsetY + blockSize >= y1 && y2 >= offsetY) {
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx, ty)
      ctx.lineTo(tx, ty)
      ctx.stroke()
    }
  }
}

export function renderNodeBubbles({
  ctx,
  clickMap,
  offsetY,
  model,
}: {
  ctx: CanvasRenderingContext2D
  clickMap: RBush<ClickEntry>
  offsetY: number
  model: MsaViewModel
}) {
  const { hierarchy, showBranchLen, collapsed, blockSize } = model
  for (const node of hierarchy.descendants()) {
    const val = showBranchLen ? 'len' : 'y'
    const {
      // @ts-expect-error
      x: y,
      // @ts-expect-error
      [val]: x,
      data,
    } = node
    const { id = '', name = '' } = data

    if (y > offsetY - extendBounds && y < offsetY + blockSize + extendBounds) {
      ctx.strokeStyle = 'black'
      ctx.fillStyle = collapsed.includes(id) ? 'black' : 'white'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      clickMap.insert({
        minX: x - radius,
        maxX: x - radius + d,
        minY: y - radius,
        maxY: y - radius + d,
        branch: true,
        id,
        name,
      })
    }
  }
}

export function renderTreeLabels({
  model,
  offsetY,
  ctx,
  clickMap,
}: {
  model: MsaViewModel
  offsetY: number
  ctx: CanvasRenderingContext2D
  clickMap: RBush<ClickEntry>
}) {
  const {
    rowHeight,
    showBranchLen,
    treeMetadata,
    hierarchy,
    blockSize,
    labelsAlignRight,
    drawTree,
    structures,
    treeAreaWidth,
    margin,
    noTree,
  } = model
  if (labelsAlignRight) {
    ctx.textAlign = 'right'
    ctx.setLineDash([1, 3])
  } else {
    ctx.textAlign = 'start'
  }
  for (const node of hierarchy.leaves()) {
    const {
      // @ts-expect-error
      x: y,
      // @ts-expect-error
      y: x,
      data: { name, id },
      // @ts-expect-error
      len,
    } = node

    const displayName = treeMetadata[name]?.genome || name

    if (y > offsetY - extendBounds && y < offsetY + blockSize + extendBounds) {
      // note: +rowHeight/4 matches with -rowHeight/4 in msa
      const yp = y + rowHeight / 4
      const xp = showBranchLen ? len : x

      const { width } = ctx.measureText(displayName)
      const height = ctx.measureText('M').width // use an 'em' for height

      const hasStructure = structures[name]
      ctx.fillStyle = hasStructure ? 'blue' : 'black'

      if (!drawTree && !labelsAlignRight) {
        ctx.fillText(displayName, 0, yp)
        clickMap.insert({
          minX: 0,
          maxX: width,
          minY: yp - height,
          maxY: yp,
          name,
          id,
        })
      } else if (labelsAlignRight) {
        const smallPadding = 2
        const offset = treeAreaWidth - smallPadding - margin.left
        if (drawTree && !noTree) {
          const { width } = ctx.measureText(displayName)
          ctx.moveTo(xp + radius + 2, y)
          ctx.lineTo(offset - smallPadding - width, y)
          ctx.stroke()
        }
        ctx.fillText(displayName, offset, yp)
        clickMap.insert({
          minX: treeAreaWidth - margin.left - width,
          maxX: treeAreaWidth - margin.left,
          minY: yp - height,
          maxY: yp,
          name,
          id,
        })
      } else {
        ctx.fillText(displayName, xp + d, yp)
        clickMap.insert({
          minX: xp + d,
          maxX: xp + d + width,
          minY: yp - height,
          maxY: yp,
          name,
          id,
        })
      }
    }
  }
  ctx.setLineDash([])
}

export function renderTreeCanvas({
  model,
  clickMap,
  ctx,
  offsetY,
}: {
  model: MsaViewModel
  offsetY: number
  ctx: CanvasRenderingContext2D
  clickMap: RBush<ClickEntry>
}) {
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
