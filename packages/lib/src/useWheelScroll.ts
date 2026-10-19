import { useEffect, useRef, useState } from 'react'

import { WheelZoomSmoother } from './wheelZoom.ts'

import type { MsaViewModel } from './model.ts'

const zoomSettleMs = 150

// a wheel event this soon after one the view took belongs to the same gesture,
// so the view keeps it at an edge rather than handing the momentum to the page
const wheelLatchMs = 150

type Axes = 'x' | 'y' | 'xy'

/**
 * Whether a vertical wheel `delta` moves a view at `scrollY`. At the top or
 * bottom, or when every row fits, the page scrolls instead, so an embedded
 * viewer never traps the reader scrolling past it.
 */
export function canScrollY(model: MsaViewModel, delta: number) {
  const { scrollY, maxScrollY } = model
  return delta > 0 ? scrollY > maxScrollY : delta < 0 && scrollY < 0
}

/**
 * The CSS touch-action for a pannable area: the browser keeps a touch pan
 * along every axis the view cannot scroll, and pinch zoom on the page.
 */
export function panTouchAction(model: MsaViewModel, axes: Axes) {
  const x = axes.includes('x') && model.maxScrollX < 0
  const y = axes.includes('y') && model.maxScrollY < 0
  return x && y
    ? 'pinch-zoom'
    : x
      ? 'pan-y pinch-zoom'
      : y
        ? 'pan-x pinch-zoom'
        : 'auto'
}

/**
 * Wheel scrolling, wheel zoom and pointer-drag panning of `model` over `ref`,
 * along `axes`. The returned `onPointerDown` starts a pan with a mouse, a pen
 * or a finger; put `touchAction` on the same element.
 */
export function useWheelScroll({
  ref,
  model,
  axes,
  zoom,
  onWheelScroll,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  model: MsaViewModel
  axes: Axes
  zoom?: boolean
  onWheelScroll?: (event: WheelEvent) => void
}) {
  const scheduled = useRef(false)
  const zoomFrame = useRef<number | undefined>(undefined)
  const zoomSettle = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  const lastTaken = useRef(Number.NEGATIVE_INFINITY)
  const zoomSmoother = useRef(new WheelZoomSmoother())
  const zoomX = useRef(0)
  const zoomY = useRef(0)
  const lastZoomTime = useRef<number | null>(null)
  const prev = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const x = axes.includes('x')
  const y = axes.includes('y')

  useEffect(() => {
    const curr = ref.current
    if (!curr) {
      return
    }
    function onWheel(event: WheelEvent) {
      // ctrlKey is also set by trackpad pinch gestures on all platforms. when
      // scrollZoom is on, a plain vertical-dominant wheel zooms too; holding
      // shift is the escape hatch to pan instead.
      const isCtrlZoom = event.ctrlKey || event.metaKey
      const isScrollZoom =
        model.scrollZoom &&
        !event.shiftKey &&
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      if (zoom && (isCtrlZoom || isScrollZoom)) {
        const rect = curr!.getBoundingClientRect()
        zoomSmoother.current.add(event.deltaY, event.deltaMode, isCtrlZoom)
        zoomX.current = event.clientX - rect.left
        zoomY.current = event.clientY - rect.top
        if (zoomFrame.current === undefined) {
          lastZoomTime.current = null
          const frame = (now: number) => {
            const elapsed =
              lastZoomTime.current === null ? 16.67 : now - lastZoomTime.current
            lastZoomTime.current = now
            model.wheelZoomToPos(
              zoomSmoother.current.step(Math.min(100, elapsed)),
              zoomX.current,
              zoomY.current,
            )
            clearTimeout(zoomSettle.current)
            zoomSettle.current = setTimeout(() => {
              model.endWheelZoom()
            }, zoomSettleMs)
            zoomFrame.current = zoomSmoother.current.idle
              ? undefined
              : requestAnimationFrame(frame)
          }
          zoomFrame.current = requestAnimationFrame(frame)
        }
        event.preventDefault()
        event.stopPropagation()
        return
      }
      // horizontal stays taken at the edges, where the page would read it as
      // a swipe back through history
      const latched = event.timeStamp - lastTaken.current < wheelLatchMs
      const takeX = x && event.deltaX !== 0
      const takeY =
        y && event.deltaY !== 0 && (latched || canScrollY(model, event.deltaY))
      if (takeX || takeY) {
        lastTaken.current = event.timeStamp
        onWheelScroll?.(event)
        deltaX.current += takeX ? event.deltaX : 0
        deltaY.current += takeY ? event.deltaY : 0
        if (!scheduled.current) {
          scheduled.current = true
          requestAnimationFrame(() => {
            model.doScrollX(-deltaX.current)
            model.doScrollY(-deltaY.current)
            deltaX.current = 0
            deltaY.current = 0
            scheduled.current = false
          })
        }
        event.preventDefault()
        event.stopPropagation()
      }
    }
    curr.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      curr.removeEventListener('wheel', onWheel)
      if (zoomFrame.current !== undefined) {
        cancelAnimationFrame(zoomFrame.current)
        zoomFrame.current = undefined
      }
      clearTimeout(zoomSettle.current)
    }
  }, [ref, model, x, y, zoom, onWheelScroll])

  useEffect(() => {
    if (!dragging) {
      return
    }
    function onMove(event: PointerEvent) {
      event.preventDefault()
      const dx = x ? event.clientX - prev.current.x : 0
      const dy = y ? event.clientY - prev.current.y : 0
      if ((dx || dy) && !scheduled.current) {
        scheduled.current = true
        requestAnimationFrame(() => {
          model.doScrollX(dx)
          model.doScrollY(dy)
          scheduled.current = false
          prev.current = { x: event.clientX, y: event.clientY }
        })
      }
    }
    function onUp() {
      setDragging(false)
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
    }
  }, [dragging, model, x, y])

  function onPointerDown(event: React.PointerEvent) {
    if (event.button === 0) {
      prev.current = { x: event.clientX, y: event.clientY }
      setDragging(true)
    }
  }

  return { onPointerDown, touchAction: panTouchAction(model, axes) }
}
