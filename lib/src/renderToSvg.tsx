import React from 'react'
import { createRoot } from 'react-dom/client'
import { when } from 'mobx'
import { renderToStaticMarkup } from '@jbrowse/core/util'
import { Theme } from '@mui/material'

// locals
import { MsaViewModel } from './model'
import { renderTreeCanvas } from './components/TreePanel/renderTreeCanvas'
import { renderBlock } from './components/MSAPanel/renderMSABlock'
import { colorContrast } from './util'

// render LGV to SVG
export async function renderToSvg(model: MsaViewModel, opts: { theme: Theme }) {
  await when(() => !!model.initialized)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { width, height, scrollX, scrollY, colorScheme, treeAreaWidth } = model
  const { theme } = opts

  const { Context } = await import('svgcanvas')
  const ctx1 = Context(width, height)
  const ctx2 = Context(width, height)
  const contrastScheme = colorContrast(colorScheme, theme)
  renderTreeCanvas({
    model,
    offsetY: scrollY,
    ctx: ctx1,
    theme,
    highResScaleFactorOverride: 1,
  })
  renderBlock({
    model,
    offsetY: scrollY,
    offsetX: -scrollX,
    contrastScheme,
    ctx: ctx2,
    highResScaleFactorOverride: 1,
  })

  // the xlink namespace is used for rendering <image> tag
  return renderToStaticMarkup(
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={[0, 0, width, height].toString()}
    >
      {/* eslint-disable-next-line react/no-danger */}
      <g dangerouslySetInnerHTML={{ __html: ctx1.getSvg().innerHTML }} />
      <g
        transform={`translate(${treeAreaWidth} 0)`}
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: ctx2.getSvg().innerHTML }}
      />
    </svg>,
    createRoot,
  )
}
