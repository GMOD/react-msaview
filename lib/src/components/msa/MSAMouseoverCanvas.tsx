import React, { useEffect, useRef } from 'react'

import { autorun } from 'mobx'
import { observer } from 'mobx-react'

import { renderMouseover } from './renderMSAMouseover'

import type { MsaViewModel } from '../../model'

const MSAMouseoverCanvas = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
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
