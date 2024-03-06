import 'pixi.js/text-bitmap'
import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'
import { Application, Assets, Sprite } from 'pixi.js'
// locals
import { MsaViewModel } from '../../model'
import MSABlock from './MSABlock'
import Loading from './Loading'

// Helper Component to ensure assets are loaded for docusaurus live examples
async function loadFont({ name, url }: { name: string; url: string }) {
  Assets.add({
    alias: name,
    src: url,
  })

  await Assets.load(name)
}

const MSACanvas = observer(function MSACanvas2({
  model,
}: {
  model: MsaViewModel
}) {
  const { msaAreaWidth, height } = model
  const ref = useRef<HTMLCanvasElement>(null)
  const completed = useRef(false)
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    if (completed.current) {
      return
    }
    completed.current = true
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      try {
        if (!ref.current) {
          return
        }

        await loadFont({
          name: 'sans-serif',
          url: 'https://s3.amazonaws.com/jbrowse.org/demos/font/sans-serif.xml',
        })

        const app = new Application()
        await app.init({
          width: msaAreaWidth,
          height,
          canvas: ref.current,
        })

        const texture = await Assets.load('sample.png')
        let sprite = Sprite.from(texture)
        app.stage.addChild(sprite)

        // Add a ticker callback to move the sprite back and forth
        let elapsed = 0.0
        app.ticker.add(ticker => {
          elapsed += ticker.deltaTime
          sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
        })
      } catch (e) {
        setError(e)
        console.error(e)
      }
    })()
  }, [])
  return error ? (
    <div style={{ color: 'red' }}>{`${error}`}</div>
  ) : (
    <canvas ref={ref} />
  )
})

export default MSACanvas
