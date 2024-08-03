import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react'
import { autorun } from 'mobx'

// locals
import type { MsaViewModel } from '../../model'
import { renderMouseover } from './renderMSAMouseover'

const MSAMouseoverCanvas = observer(({ model }: { model: MsaViewModel }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const { height, width } = model
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    return ctx
      ? autorun(() => {
          renderMouseover({ ctx, model })
        })
      : undefined
  }, [model])

  return (
    <canvas
      ref={ref}
      id="mouseover"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    />
  )
})

export default MSAMouseoverCanvas
