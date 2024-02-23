import RBush from 'rbush'
import { Theme } from '@mui/material'

// locals
import { MsaViewModel } from '../../model'

export const padding = 600
const extendBounds = 5
const radius = 2.5
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
  theme,
  blockSizeYOverride,
}: {
  offsetY: number
  ctx: CanvasRenderingContext2D
  model: MsaViewModel
  theme: Theme
  blockSizeYOverride?: number
}) {
  const { hierarchy, showBranchLen, blockSize } = model
  const by = blockSizeYOverride || blockSize
  ctx.strokeStyle = theme.palette.text.primary
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
    if (offsetY + by >= y1 && y2 >= offsetY) {
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
  blockSizeYOverride,
}: {
  ctx: CanvasRenderingContext2D
  clickMap?: RBush<ClickEntry>
  offsetY: number
  model: MsaViewModel
  theme: Theme
  blockSizeYOverride?: number
}) {
  const {
    hierarchy,
    showBranchLen,
    collapsed,
    blockSize,
    marginLeft: ml,
  } = model
  const by = blockSizeYOverride || blockSize
  for (const node of hierarchy.descendants()) {
    const val = showBranchLen ? 'len' : 'y'
    const {
      // @ts-expect-error
      x: y,
      // @ts-expect-error
      [val]: x,
      data,
    } = node
    const { branchset, id = '', name = '' } = data
    if (
      branchset.length &&
      y > offsetY - extendBounds &&
      y < offsetY + by + extendBounds
    ) {
      ctx.strokeStyle = 'black'
      ctx.fillStyle = collapsed.includes(id) ? 'black' : 'white'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      clickMap?.insert({
        minX: x - radius + ml,
        maxX: x - radius + d + ml,
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
  theme,
  model,
  offsetY,
  ctx,
  clickMap,
  blockSizeYOverride,
}: {
  model: MsaViewModel
  offsetY: number
  ctx: CanvasRenderingContext2D
  clickMap?: RBush<ClickEntry>
  theme: Theme
  blockSizeYOverride?: number
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
    treeAreaWidthMinusMargin,
    marginLeft: ml,
    noTree,
  } = model
  const by = blockSizeYOverride || blockSize
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

    if (y > offsetY - extendBounds && y < offsetY + by + extendBounds) {
      // note: +rowHeight/4 matches with -rowHeight/4 in msa
      const yp = y + rowHeight / 4
      const xp = showBranchLen ? len : x

      const { width } = ctx.measureText(displayName)
      const height = ctx.measureText('M').width // use an 'em' for height

      const hasStructure = structures[name]
      ctx.fillStyle = hasStructure ? 'blue' : theme.palette.text.primary

      if (!drawTree && !labelsAlignRight) {
        ctx.fillText(displayName, 0, yp)
        clickMap?.insert({
          minX: 0 + ml,
          maxX: width + ml,
          minY: yp - height,
          maxY: yp,
          name,
          id,
        })
      } else if (labelsAlignRight) {
        const smallPadding = 2
        const offset = treeAreaWidthMinusMargin - smallPadding
        if (drawTree && !noTree) {
          const { width } = ctx.measureText(displayName)
          ctx.moveTo(xp + radius + 2, y)
          ctx.lineTo(offset - smallPadding - width, y)
          ctx.stroke()
        }
        ctx.fillText(displayName, offset, yp)
        clickMap?.insert({
          minX: treeAreaWidth - width + ml,
          maxX: treeAreaWidth + ml,
          minY: yp - height,
          maxY: yp,
          name,
          id,
        })
      } else {
        ctx.fillText(displayName, xp + d, yp)
        clickMap?.insert({
          minX: xp + d + ml,
          maxX: xp + d + width + ml,
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
  theme,
  highResScaleFactorOverride,
  blockSizeYOverride,
}: {
  model: MsaViewModel
  offsetY: number
  ctx: CanvasRenderingContext2D
  clickMap?: RBush<ClickEntry>
  theme: Theme
  highResScaleFactorOverride?: number
  blockSizeYOverride?: number
}) {
  clickMap?.clear()
  const {
    noTree,
    drawTree,
    drawNodeBubbles,
    treeWidth,
    highResScaleFactor,
    blockSize,
    fontSize,
    rowHeight,
    marginLeft,
    nref,
  } = model
  const by = blockSizeYOverride || blockSize

  ctx.resetTransform()

  // this is a bogus use of nref, it is never less than 0. we just are using it
  // in this statement because otherwise it would be an unused variable, we
  // just need to use nref to indicate a redraw in an autorun when canvas ref
  // is updated and in order to convince bundlers like not to delete unused
  // usage with propertyReadSideEffects
  const k =
    nref < 0 ? -Infinity : highResScaleFactorOverride || highResScaleFactor
  ctx.scale(k, k)
  ctx.clearRect(0, 0, treeWidth + padding, by)
  ctx.translate(marginLeft, -offsetY)

  const font = ctx.font
  ctx.font = font.replace(/\d+px/, `${fontSize}px`)

  if (!noTree && drawTree) {
    renderTree({
      ctx,
      offsetY,
      model,
      theme,
      blockSizeYOverride,
    })

    if (drawNodeBubbles) {
      renderNodeBubbles({
        ctx,
        offsetY,
        clickMap,
        model,
        theme,
        blockSizeYOverride,
      })
    }
  }

  if (rowHeight >= 5) {
    renderTreeLabels({
      ctx,
      offsetY,
      model,
      clickMap,
      theme,
      blockSizeYOverride,
    })
  }
}
