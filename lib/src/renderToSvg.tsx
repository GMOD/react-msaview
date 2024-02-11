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
import MinimapSVG from './components/MinimapSVG'

export async function renderToSvg(
  model: MsaViewModel,
  opts: { theme: Theme; includeMinimap?: boolean; exportType: string },
) {
  await when(() => !!model.initialized)
  const { width, height, scrollX, scrollY } = model
  const { exportType, theme, includeMinimap } = opts

  if (exportType === 'entire') {
    return render({
      width: model.totalWidth,
      height: model.totalHeight,
      theme,
      model,
      offsetY: 0,
      offsetX: 0,
      includeMinimap,
    })
  } else if (exportType === 'viewport') {
    return render({
      width,
      height,
      theme,
      model,
      offsetY: scrollY,
      offsetX: -scrollX,
      includeMinimap,
    })
  } else {
    throw new Error('unknown export type')
  }
}

async function render({
  width,
  height,
  offsetX,
  offsetY,
  theme,
  model,
  includeMinimap,
}: {
  width: number
  height: number
  offsetX: number
  offsetY: number
  theme: Theme
  model: MsaViewModel
  includeMinimap?: boolean
}) {
  const { Context } = await import('svgcanvas')
  const { treeAreaWidth, colorScheme } = model
  const contrastScheme = colorContrast(colorScheme, theme)
  const ctx1 = Context(width, height)
  const ctx2 = Context(width, height)
  renderTreeCanvas({
    model,
    offsetY,
    ctx: ctx1,
    theme,
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })
  renderMSABlock({
    model,
    offsetY,
    offsetX,
    contrastScheme,
    ctx: ctx2,
    blockSizeXOverride: width - treeAreaWidth,
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })

  const Wrapper = includeMinimap ? MinimapWrapper : NullWrapper
  const clipId = 'tree'
  return renderToStaticMarkup(
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={[0, 0, width, height].toString()}
    >
      <Wrapper model={model}>
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
      </Wrapper>
    </svg>,
    createRoot,
  )
}

function MinimapWrapper({
  model,
  children,
}: {
  model: MsaViewModel
  children: React.ReactNode
}) {
  const { minimapHeight, treeAreaWidth } = model

  return (
    <>
      <g transform={`translate(${treeAreaWidth} 0)`}>
        <MinimapSVG model={model} />
      </g>

      <g transform={`translate(0 ${minimapHeight})`}>{children}</g>
    </>
  )
}

function NullWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
