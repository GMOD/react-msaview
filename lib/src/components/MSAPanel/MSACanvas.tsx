import 'pixi.js/text-bitmap'
import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'
import { Application, Assets, Text, BitmapText } from 'pixi.js'
// locals
import { MsaViewModel } from '../../model'
import MSABlock from './MSABlock'
import Loading from './Loading'
import { ErrorMessage } from '@jbrowse/core/ui'

// Helper Component to ensure assets are loaded for docusaurus live examples

const MSACanvas = observer(function MSACanvas2({
  model,
}: {
  model: MsaViewModel
}) {
  const { msaAreaWidth, height } = model
  const ref = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      try {
        if (!ref.current) {
          return
        }
        const app = new Application()
        await app.init({
          width: msaAreaWidth,
          height,
          canvas: ref.current,
          resizeTo: ref.current,
        })

        const ret = [] as BitmapText[]
        for (let i = 0; i < 100; i++) {
          const x = new BitmapText({
            text: 'word',
            x: msaAreaWidth * Math.random(),
            y: height * Math.random(),
            style: {
              fontFamily: 'Arial',
              fontSize: 20,
            },
          })
          ret.push(x)
          app.stage.addChild(x)
        }

        // Add a ticker callback to move the sprite back and forth
        app.ticker.add(ticker => {
          for (const elt of ret) {
            elt.updateTransform({
              x: elt.x + (Math.random() - 0.5) * 1,
              y: elt.y + (Math.random() - 0.5) * 1,
            })
          }
        })
      } catch (e) {
        setError(e)
        console.error(e)
      }
    })()
  }, [height, msaAreaWidth])
  const e = error
  return e ? (
    <ErrorMessage error={e} />
  ) : (
    <canvas width={msaAreaWidth} height={height} ref={ref} />
  )
})

export default MSACanvas
