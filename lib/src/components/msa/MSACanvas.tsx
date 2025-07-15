import 'pixi.js/text-bitmap'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import { ErrorMessage } from '@jbrowse/core/ui'
import { useTheme } from '@mui/material'
import { Application, BitmapText } from 'pixi.js'

// locals
import { MsaViewModel } from '../../model'
import { renderMSABlock } from './renderMSABlock'
import { colorContrast } from '../../util'

// Helper Component to ensure assets are loaded for docusaurus live examples

const MSACanvas = observer(function MSACanvas2({
  model,
}: {
  model: MsaViewModel
}) {
  const { colorScheme, msaAreaWidth, height } = model
  const ref = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<unknown>()
  const theme = useTheme()

  const contrastScheme = useMemo(
    () => colorContrast(colorScheme, theme),
    [colorScheme, theme],
  )

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

        const letters = [] as BitmapText[]
        // for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        //   const x = new BitmapText({
        //     text: letter,
        //     x: msaAreaWidth * Math.random(),
        //     y: height * Math.random(),
        //     style: {
        //       fontFamily: 'Arial',
        //       fontSize: 20,
        //     },
        //   })
        //   letters.push(x)
        //   app.stage.addChild(x)
        // }

        // Add a ticker callback to move the sprite back and forth
        // app.ticker.add(ticker => {
        //   for (const elt of letters) {
        //     elt.updateTransform({
        //       x: elt.x + (Math.random() - 0.5) * 1,
        //       y: elt.y + (Math.random() - 0.5) * 1,
        //     })
        //   }
        // })
        renderMSABlock({ app, contrastScheme, theme, model })
      } catch (e) {
        setError(e)
        console.error(e)
      }
    })()
  }, [height, model, theme, contrastScheme, msaAreaWidth])
  const e = error
  return e ? (
    <ErrorMessage error={e} />
  ) : (
    <canvas
      onWheel={event => {
        model.setScrollX(model.scrollX - event.deltaX)
        model.setScrollY(model.scrollY - event.deltaY)
      }}
      width={msaAreaWidth}
      height={height}
      ref={ref}
    />
  )
})

export default MSACanvas
