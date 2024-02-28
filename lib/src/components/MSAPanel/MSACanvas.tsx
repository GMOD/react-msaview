import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'
import * as PIXI from 'pixi.js'
import { Assets } from 'pixi.js'
import { Stage, Container, Sprite, Text, BitmapText } from '@pixi/react'
// locals
import { MsaViewModel } from '../../model'
import MSABlock from './MSABlock'
import Loading from './Loading'

// Helper Component to ensure assets are loaded for docusaurus live examples
const ExampleAssetLoader = ({
  name,
  url,
  loader,
  children,
}: {
  name: string
  url: string
  loader: React.ReactNode
  children: React.ReactNode
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadAsset = async () => {
      Assets.add({
        alias: name,
        src: url,
      })

      await Assets.load(name)
      setIsLoaded(true)
    }

    loadAsset().catch(console.error)
  }, [name, url])

  return isLoaded ? children : loader
}

const MSACanvas = observer(function MSACanvas2({
  model,
}: {
  model: MsaViewModel
}) {
  const { msaAreaWidth, height } = model

  return (
    <Stage width={msaAreaWidth} height={height} options={{ hello: true }}>
      <ExampleAssetLoader
        name="sans-serif"
        url="https://s3.amazonaws.com/jbrowse.org/demos/font/sans-serif.xml"
        loader={
          <Text
            x={100}
            y={100}
            text="⌛ Loading font..."
            style={
              new PIXI.TextStyle({
                fill: ['#ffffff'],
              })
            }
          />
        }
      >
        <BitmapText
          x={100}
          y={100}
          text="Hello World!"
          style={{
            fontName: 'sans-serif',
            fontSize: 72,
          }}
        />
      </ExampleAssetLoader>
    </Stage>
  )
})

export default MSACanvas
