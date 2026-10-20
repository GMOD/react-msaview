import React, { useRef } from 'react'

import { observer } from 'mobx-react'

import { useWheelScroll } from '../../useWheelScroll.ts'
import { zoomSnapshotScale } from '../../zoomSnapshot.ts'
import { alignmentAriaLabel } from '../controls.ts'
import Loading from './Loading.tsx'
import MSACanvasBlock from './MSACanvasBlock.tsx'
import { WheelZoomHint, useWheelZoomHint } from './WheelZoomHint.tsx'
import { onMsaKey } from './msaKeys.ts'

import type { MsaViewModel } from '../../model.ts'

const MSACanvas = observer(function ({ model }: { model: MsaViewModel }) {
  const {
    MSA,
    msaFilehandle,
    effectiveHeight: height,
    msaCanvasWidth,
    blocks2d,
    scrollX,
    scrollY,
    zoomSnapshot,
  } = model
  const blocks = zoomSnapshot
    ? zoomSnapshot.blocksY.flatMap(by =>
        zoomSnapshot.blocksX.map(bx => [bx, by] as const),
      )
    : blocks2d
  const scale = zoomSnapshot
    ? zoomSnapshotScale(model, zoomSnapshot)
    : undefined
  const ref = useRef<HTMLDivElement>(null)
  const hint = useWheelZoomHint(model)
  const { onPointerDown, touchAction } = useWheelScroll({
    ref,
    model,
    axes: 'xy',
    zoom: true,
    onWheelScroll: hint.onWheelScroll,
  })

  return (
    <div
      ref={ref}
      // screenshot callouts anchor to columns from this rect's origin:
      // col*colWidth + scrollX, row*rowHeight + scrollY
      data-testid="msa_canvas"
      tabIndex={0}
      aria-label={alignmentAriaLabel}
      onKeyDown={event => {
        if (onMsaKey(model, event)) {
          event.preventDefault()
        }
      }}
      // a shifted press selects cells (useMsaBlockMouse), so it takes the
      // focus Escape clears from, and leaves out the pan and the page's own
      // text selection
      onMouseDown={event => {
        if (event.shiftKey) {
          event.preventDefault()
          ref.current?.focus({ preventScroll: true })
        }
      }}
      onPointerDown={event => {
        if (!event.shiftKey) {
          onPointerDown(event)
        }
      }}
      style={{
        position: 'relative',
        touchAction,
        height,
        width: msaCanvasWidth,
        overflow: 'hidden',
      }}
    >
      {!MSA && !msaFilehandle ? null : MSA ? (
        // one transform for the whole block set, so a scroll frame is a
        // compositor move rather than a style write per block
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${scrollX}px, ${scrollY}px)${scale ? ` scale(${scale.sx}, ${scale.sy})` : ''}`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {blocks.map(([bx, by]) => (
            <MSACanvasBlock
              key={`${bx}_${by}`}
              model={model}
              offsetX={bx}
              offsetY={by}
            />
          ))}
        </div>
      ) : (
        <Loading />
      )}
      {hint.visible ? <WheelZoomHint /> : null}
    </div>
  )
})

export default MSACanvas
