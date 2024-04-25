import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'
import TreeCanvasBlock from './TreeCanvasBlock'
import { padding } from './renderTreeCanvas'

const TreeCanvas = observer(function ({ model }: { model: MsaViewModel }) {
  const ref = useRef<HTMLDivElement>(null)
  const scheduled = useRef(false)
  const deltaY = useRef(0)
  const prevY = useRef<number>(0)
  const { treeWidth, height, blocksY } = model
  const [mouseDragging, setMouseDragging] = useState(false)

  useEffect(() => {
    const curr = ref.current
    if (!curr) {
      return
    }
    function onWheel(event: WheelEvent) {
      deltaY.current += event.deltaY

      if (!scheduled.current) {
        scheduled.current = true
        requestAnimationFrame(() => {
          model.doScrollY(-deltaY.current)
          deltaY.current = 0
          scheduled.current = false
        })
      }
      event.preventDefault()
      event.stopPropagation()
    }
    curr.addEventListener('wheel', onWheel)
    return () => {
      curr.removeEventListener('wheel', onWheel)
    }
  }, [model])

  useEffect(() => {
    let cleanup = () => {}

    function globalMouseMove(event: MouseEvent) {
      event.preventDefault()
      const currY = event.clientY
      const distanceY = currY - prevY.current
      if (distanceY) {
        // use rAF to make it so multiple event handlers aren't fired per-frame
        // see https://calendar.perfplanet.com/2013/the-runtime-performance-checklist/
        if (!scheduled.current) {
          scheduled.current = true
          window.requestAnimationFrame(() => {
            model.doScrollY(distanceY)
            scheduled.current = false
            prevY.current = event.clientY
          })
        }
      }
    }

    function globalMouseUp() {
      prevY.current = 0
      if (mouseDragging) {
        setMouseDragging(false)
      }
    }

    if (mouseDragging) {
      window.addEventListener('mousemove', globalMouseMove, true)
      window.addEventListener('mouseup', globalMouseUp, true)
      cleanup = () => {
        window.removeEventListener('mousemove', globalMouseMove, true)
        window.removeEventListener('mouseup', globalMouseUp, true)
      }
    }
    return cleanup
  }, [model, mouseDragging])

  function mouseDown(event: React.MouseEvent) {
    // check if clicking a draggable element or a resize handle
    const target = event.target as HTMLElement
    if (target.draggable || target.dataset.resizer) {
      return
    }

    // otherwise do click and drag scroll
    if (event.button === 0) {
      prevY.current = event.clientY
      setMouseDragging(true)
    }
  }

  // this local mouseup is used in addition to the global because sometimes
  // the global add/remove are not called in time, resulting in issue #533
  function mouseUp(event: React.MouseEvent) {
    event.preventDefault()
    setMouseDragging(false)
  }

  function mouseLeave(event: React.MouseEvent) {
    event.preventDefault()
  }

  return (
    <div
      ref={ref}
      onMouseDown={mouseDown}
      onMouseUp={mouseUp}
      onMouseLeave={mouseLeave}
      style={{
        height,
        position: 'relative',
        width: treeWidth + padding,
      }}
    >
      {blocksY.map(block => (
        <TreeCanvasBlock key={block} model={model} offsetY={block} />
      ))}
    </div>
  )
})

export default TreeCanvas
