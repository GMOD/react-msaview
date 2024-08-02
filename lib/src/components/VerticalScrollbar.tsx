import { observer } from 'mobx-react'
import React, { useEffect, useRef, useState } from 'react'
import { MsaViewModel } from '../model'
import { clamp } from '../util'

const VerticalScrollbar = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  const { height: H, scrollY, rows, rowHeight } = model
  const [hovered, setHovered] = useState(false)
  const scheduled = useRef(false)
  const [mouseDown, setMouseDown] = useState<{
    clientY: number
    scrollY: number
  }>()
  const fill = 'rgba(66, 119, 127, 0.3)'
  const unit = H / rows.length / rowHeight
  const top = -scrollY
  const bottom = top + H
  const t = top * unit
  const b = bottom * unit
  useEffect(() => {
    function fn(event: MouseEvent) {
      if (mouseDown !== undefined) {
        if (!scheduled.current) {
          scheduled.current = true
          window.requestAnimationFrame(() => {
            console.log(
              mouseDown.scrollY - (event.clientY - mouseDown.clientY) / unit,
              -rowHeight * rows.length,
            )
            model.setScrollY(
              clamp(
                -rowHeight * rows.length,
                mouseDown.scrollY - (event.clientY - mouseDown.clientY) / unit,
                0,
              ),
            )
            scheduled.current = false
          })
        }
      }
    }
    function fn2() {
      setMouseDown(undefined)
    }
    if (mouseDown !== undefined) {
      document.addEventListener('mousemove', fn)
      document.addEventListener('mouseup', fn2)
      return () => {
        document.removeEventListener('mousemove', fn)
        document.removeEventListener('mousemove', fn2)
      }
    }
  }, [model, unit, mouseDown])
  return (
    <div
      style={{
        position: 'relative',
        width: 20,
        height: H,
        borderLeft: '1px solid #555',
        borderTop: '1px solid #555',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: Math.max(0, t),
          left: 0,
          background: hovered ? 'rgba(66,119,127,0.6)' : fill,
          cursor: 'pointer',
          boxSizing: 'border-box',
          width: 20,
          height: b - t,
          zIndex: 100,
        }}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        onMouseDown={event => {
          setMouseDown({
            clientY: event.clientY,
            scrollY: model.scrollY,
          })
        }}
      />
    </div>
  )
})
export default VerticalScrollbar
