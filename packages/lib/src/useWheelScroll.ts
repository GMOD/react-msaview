import { useEffect, useRef, useState } from 'react'

import { WheelZoomSmoother } from './wheelZoom.ts'

export function useWheelScroll({
  ref,
  onScrollX,
  onScrollY,
  onZoom,
  scrollZoom,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  onScrollX?: (delta: number) => void
  onScrollY?: (delta: number) => void
  onZoom?: (scaleFactor: number, offsetX: number, offsetY: number) => void
  scrollZoom?: boolean
}) {
  const scheduled = useRef(false)
  const zoomFrame = useRef<number | undefined>(undefined)
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  const zoomSmoother = useRef(new WheelZoomSmoother())
  const zoomX = useRef(0)
  const zoomY = useRef(0)
  const lastZoomTime = useRef<number | null>(null)
  const prevX = useRef(0)
  const prevY = useRef(0)
  const [mouseDragging, setMouseDragging] = useState(false)

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
        scrollZoom &&
        !event.shiftKey &&
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      if (onZoom && (isCtrlZoom || isScrollZoom)) {
        const zoom = onZoom
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
            zoom(
              zoomSmoother.current.step(Math.min(100, elapsed)),
              zoomX.current,
              zoomY.current,
            )
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
      // only swallow the wheel event on an axis we actually handle, otherwise a
      // vertical wheel over an x-only scroller (e.g. a Track) blocks page scroll
      const consumeX = !!onScrollX && event.deltaX !== 0
      const consumeY = !!onScrollY && event.deltaY !== 0
      if (consumeX || consumeY) {
        if (onScrollX) {
          deltaX.current += event.deltaX
        }
        if (onScrollY) {
          deltaY.current += event.deltaY
        }

        if (!scheduled.current) {
          scheduled.current = true
          requestAnimationFrame(() => {
            if (onScrollX) {
              onScrollX(-deltaX.current)
              deltaX.current = 0
            }
            if (onScrollY) {
              onScrollY(-deltaY.current)
              deltaY.current = 0
            }
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
    }
  }, [ref, onScrollX, onScrollY, onZoom, scrollZoom])

  useEffect(() => {
    if (!mouseDragging) {
      return
    }
    function globalMouseMove(event: MouseEvent) {
      event.preventDefault()
      const distanceX = event.clientX - prevX.current
      const distanceY = event.clientY - prevY.current
      if ((distanceX && onScrollX) || (distanceY && onScrollY)) {
        if (!scheduled.current) {
          scheduled.current = true
          requestAnimationFrame(() => {
            onScrollX?.(distanceX)
            onScrollY?.(distanceY)
            scheduled.current = false
            prevX.current = event.clientX
            prevY.current = event.clientY
          })
        }
      }
    }

    function globalMouseUp() {
      prevX.current = 0
      prevY.current = 0
      setMouseDragging(false)
    }

    window.addEventListener('mousemove', globalMouseMove, true)
    window.addEventListener('mouseup', globalMouseUp, true)
    return () => {
      window.removeEventListener('mousemove', globalMouseMove, true)
      window.removeEventListener('mouseup', globalMouseUp, true)
    }
  }, [mouseDragging, onScrollX, onScrollY])

  function onMouseDown(event: React.MouseEvent) {
    if (event.button === 0) {
      prevX.current = event.clientX
      prevY.current = event.clientY
      setMouseDragging(true)
    }
  }

  function onMouseUp(event: React.MouseEvent) {
    event.preventDefault()
    setMouseDragging(false)
  }

  return { onMouseDown, onMouseUp }
}
