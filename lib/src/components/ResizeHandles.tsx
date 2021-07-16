import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'

export const VerticalResizeHandle = observer(
  ({ model }: { model: MsaViewModel }) => {
    const { resizeHandleWidth } = model
    const [cropMouseDown, setCropMouseDown] = useState(false)

    // this has the effect of just "cropping" the tree area
    useEffect(() => {
      if (cropMouseDown) {
        const listener = (event: MouseEvent) => {
          model.setTreeAreaWidth(model.treeAreaWidth + event.movementX)
        }

        const listener2 = () => setCropMouseDown(false)

        document.addEventListener('mousemove', listener)
        document.addEventListener('mouseup', listener2)
        return () => {
          document.removeEventListener('mousemove', listener)
          document.removeEventListener('mouseup', listener2)
        }
      }
      return () => {}
    }, [cropMouseDown, model])

    return (
      <div>
        <div
          onMouseDown={() => setCropMouseDown(true)}
          style={{
            cursor: 'ew-resize',
            height: '100%',
            width: resizeHandleWidth,
            background: `rgba(200,200,200)`,
            position: 'relative',
          }}
        />
      </div>
    )
  },
)

export const HorizontalResizeHandle = observer(
  ({ model }: { model: MsaViewModel }) => {
    const { resizeHandleWidth } = model
    const [cropMouseDown, setCropMouseDown] = useState(false)

    // this has the effect of just "cropping" the tree area
    useEffect(() => {
      if (cropMouseDown) {
        const listener = (event: MouseEvent) => {
          model.setHeight(model.height + event.movementY)
        }

        const listener2 = () => setCropMouseDown(false)

        document.addEventListener('mousemove', listener)
        document.addEventListener('mouseup', listener2)
        return () => {
          document.removeEventListener('mousemove', listener)
          document.removeEventListener('mouseup', listener2)
        }
      }
      return () => {}
    }, [cropMouseDown, model])

    return (
      <div>
        <div
          onMouseDown={() => setCropMouseDown(true)}
          style={{
            cursor: 'ns-resize',
            width: '100%',
            height: resizeHandleWidth,
            background: `rgba(200,200,200)`,
            position: 'relative',
          }}
        />
      </div>
    )
  },
)
