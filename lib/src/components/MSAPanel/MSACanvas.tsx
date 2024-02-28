import React, { useEffect, useState, useMemo, useRef } from 'react'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'
import * as PIXI from 'pixi.js'
import { Assets, BlurFilter } from 'pixi.js'
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
  loader: any
  children: React.ReactNode
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadAsset = async () => {
      Assets.add(name, url)

      await Assets.load(name)
      setIsLoaded(true)
    }

    loadAsset().catch(console.error)
  }, [name, url])

  return isLoaded ? children : loader
}

function loadFontFromBlob(fontBlob, onComplete) {
  const reader = new FileReader()
  reader.onload = function (event) {
    const fontData = event.target.result
    // Parse the font data based on its format (e.g., BMFont)
    const parsedFont = parseFontData(fontData)

    // Create a new PIXI.BitmapText object
    const text = new PIXI.BitmapText('Sample Text', parsedFont)
    onComplete(text)
  }
  reader.readAsText(fontBlob)
}

// Usage
loadFontFromBlob(fontBlob, text => {
  // Add the text object to your PIXI stage
  app.stage.addChild(text)
})

const MSACanvas = observer(function MSACanvas2({
  model,
}: {
  model: MsaViewModel
}) {
  const { msaAreaWidth, height } = model
  const blurFilter = useMemo(() => new BlurFilter(4), [])

  return (
    <Stage width={msaAreaWidth} height={height}>
      <ExampleAssetLoader
        name="desyrel"
        url="/pixi-react/font/desyrel.xml"
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
          style={{ fontName: 'Desyrel', fontSize: 50 }}
        />
      </ExampleAssetLoader>
    </Stage>
  )
})

export default MSACanvas
