import React, { useRef, useMemo, useEffect } from 'react'
import { observer } from 'mobx-react'
import { getSnapshot, isStateTreeNode } from 'mobx-state-tree'

// locals
import { IBoxTrack, MsaViewModel } from '../model'
import Layout from '../layout'

interface Feat {
  start: number
  end: number
}

const BoxTrackBlock = observer(function ({
  track,
  model,
  offsetX,
}: {
  track: IBoxTrack
  model: MsaViewModel
  offsetX: number
}) {
  const {
    blockSize,
    colWidth,
    blanks,
    rowHeight,
    highResScaleFactor,
    scrollX,
  } = model
  const { height, features, associatedRowName } = track.model

  const feats: Feat[] = isStateTreeNode(features)
    ? // @ts-expect-error
      getSnapshot(features)
    : features

  const layout = useMemo(() => {
    const temp = new Layout()

    feats?.forEach((feature, index) => {
      const { start, end } = feature
      if (associatedRowName) {
        const s = model.rowSpecificBpToPx(associatedRowName, start - 1)
        const e = model.rowSpecificBpToPx(associatedRowName, end)
        temp.addRect(`${index}`, s, e, rowHeight, feature)
      } else {
        const s = model.globalBpToPx(start - 1)
        const e = model.globalBpToPx(end)
        temp.addRect(`${index}`, s, e, rowHeight, feature)
      }
    })
    return temp

    // might convert to autorun based drawing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowHeight, feats, associatedRowName, model, blanks])

  const ref = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLCanvasElement>(null)
  const mouseoverRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const ctx = ref.current.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.resetTransform()
    ctx.scale(highResScaleFactor, highResScaleFactor)
    ctx.clearRect(0, 0, blockSize, height)
    ctx.translate(-offsetX, 0)
    ctx.textAlign = 'center'
    ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

    const xStart = Math.max(0, Math.floor(offsetX / colWidth))
    ctx.fillStyle = 'goldenrod'
    layout.rectangles.forEach(value => {
      const { minX, maxX, minY, maxY } = value

      const x1 = (minX - xStart) * colWidth + offsetX - (offsetX % colWidth)
      const x2 = (maxX - xStart) * colWidth + offsetX - (offsetX % colWidth)

      if (x2 - x1 > 0) {
        ctx.fillRect(x1, minY, x2 - x1, (maxY - minY) / 2)
      }
    })
  }, [
    associatedRowName,
    blockSize,
    colWidth,
    layout.rectangles,
    model,
    rowHeight,
    height,
    offsetX,
    highResScaleFactor,
    features,
    blanks,
  ])

  useEffect(() => {
    if (!labelRef.current) {
      return
    }

    const ctx = labelRef.current.getContext('2d')
    if (!ctx) {
      return
    }

    // this logic is very similar to MSACanvas
    ctx.resetTransform()
    ctx.scale(highResScaleFactor, highResScaleFactor)
    ctx.clearRect(0, 0, blockSize, height)
    ctx.translate(-offsetX, 0)
    ctx.textAlign = 'center'
    ctx.font = ctx.font.replace(/\d+px/, `${Math.max(8, rowHeight - 8)}px`)

    ctx.fillStyle = 'black'
    ctx.textAlign = 'left'
    for (const value of layout.rectangles.values()) {
      const { minX, maxX, maxY, minY, data } = value

      const x1 = minX * colWidth
      const x2 = maxX * colWidth
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feature = data as any

      if (x2 - x1 > 0) {
        const note = feature.attributes?.Note?.[0]
        const name = feature.attributes?.Name?.[0]
        const type = feature.type
        ctx.fillText(
          [type, name, note].filter(f => !!f).join(' - '),
          Math.max(Math.min(-scrollX, x2), x1),
          minY + (maxY - minY),
        )
      }
    }
  }, [
    blockSize,
    colWidth,
    scrollX,
    highResScaleFactor,
    height,
    layout.rectangles,
    offsetX,
    features,
    model,
    rowHeight,
    blanks,
  ])

  return !features ? null : (
    <>
      <canvas
        ref={ref}
        height={height * highResScaleFactor}
        width={blockSize * highResScaleFactor}
        style={{
          position: 'absolute',
          left: scrollX + offsetX,
          width: blockSize,
          height,
        }}
      />
      <canvas
        ref={labelRef}
        height={height * highResScaleFactor}
        width={blockSize * highResScaleFactor}
        style={{
          position: 'absolute',
          left: scrollX + offsetX,
          width: blockSize,
          height,
        }}
      />
      <canvas
        ref={mouseoverRef}
        height={height * highResScaleFactor}
        width={blockSize * highResScaleFactor}
        style={{
          position: 'absolute',
          left: scrollX + offsetX,
          width: blockSize,
          height,
        }}
      />
    </>
  )
})

export default BoxTrackBlock
