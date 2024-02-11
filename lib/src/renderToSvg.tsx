import React from 'react'
import { createRoot } from 'react-dom/client'
import { when } from 'mobx'
import { renderToStaticMarkup } from '@jbrowse/core/util'
import { Theme } from '@mui/material'

// locals
import { MsaViewModel } from './model'
import { renderTreeCanvas } from './components/TreePanel/renderTreeCanvas'
import { renderMSABlock } from './components/MSAPanel/renderMSABlock'
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
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })
  renderMSABlock({
    model,
    offsetY: scrollY,
    offsetX: -scrollX,
    contrastScheme,
    ctx: ctx2,
    blockSizeXOverride: width - treeAreaWidth,
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })

  const clipId = 'tree'
  // the xlink namespace is used for rendering <image> tag
  return renderToStaticMarkup(
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={[0, 0, width, height].toString()}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={treeAreaWidth} height={height} />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${clipId})`}
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: ctx1.getSvg().innerHTML }}
      />
      <g
        transform={`translate(${treeAreaWidth} 0)`}
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: ctx2.getSvg().innerHTML }}
      />
    </svg>,
    createRoot,
  )
}
