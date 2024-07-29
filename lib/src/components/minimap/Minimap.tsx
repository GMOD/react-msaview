import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../../model'

const Minimap = observer(function ({ model }: { model: MsaViewModel }) {
  const [mouseDown, setMouseDown] = useState<{
    clientX: number
    scrollX: number
  }>()
  const scheduled = useRef(false)
  const [hovered, setHovered] = useState(false)
  const {
    scrollX,
    msaAreaWidth: W,
    minimapHeight: H,
    colWidth,
    numColumns,
  } = model
  const unit = W / numColumns / colWidth
  const left = -scrollX
  const right = left + W
  const s = left * unit
  const e = right * unit
  const fill = 'rgba(66, 119, 127, 0.3)'

  useEffect(() => {
    function fn(event: MouseEvent) {
      if (mouseDown !== undefined) {
        if (!scheduled.current) {
          scheduled.current = true
          console.log('wow')
          window.requestAnimationFrame(() => {
            console.log('wow2')
            model.setScrollX(
              mouseDown.scrollX - (event.clientX - mouseDown.clientX) / unit,
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

  const BAR_HEIGHT = 12
  const H2 = H - 12
  return (
    <div style={{ position: 'relative', height: H, width: '100%' }}>
      <div
        style={{
          boxSizing: 'border-box',
          height: BAR_HEIGHT,
          border: '1px solid #555',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: Math.max(0, s),
          background: hovered ? 'rgba(66,119,127,0.6)' : fill,
          cursor: 'pointer',
          border: '1px solid #555',
          boxSizing: 'border-box',
          height: BAR_HEIGHT,
          width: e - s,
          zIndex: 100,
        }}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        onMouseDown={event => {
          setMouseDown({
            clientX: event.clientX,
            scrollX: model.scrollX,
          })
        }}
      />

      <svg height={H2} style={{ width: '100%' }}>
        <polygon
          fill={fill}
          points={[
            [e, 0],
            [s, 0],
            [0, H2],
            [W, H2],
          ].toString()}
        />
      </svg>
    </div>
  )
})

export default Minimap
