import React from 'react'
import { createRoot } from 'react-dom/client'
import { when } from 'mobx'
import { renderToStaticMarkup } from '@jbrowse/core/util'
import { Theme } from '@mui/material'

// locals
import { MsaViewModel } from './model'
import { renderTreeCanvas } from './components/tree/renderTreeCanvas'
import { renderMSABlock } from './components/msa/renderMSABlock'
import { colorContrast } from './util'

import MinimapSVG from './components/minimap/MinimapSVG'
import { renderBoxFeatureCanvasBlock } from './components/msa/renderBoxFeatureCanvasBlock'

export async function renderToSvg(
  model: MsaViewModel,
  opts: { theme: Theme; includeMinimap?: boolean; exportType: string },
) {
  await when(() => !!model.dataInitialized)
  const { width, height, scrollX, scrollY } = model
  const { exportType, theme, includeMinimap } = opts

  if (exportType === 'entire') {
    return render({
      width: model.totalWidth + model.treeAreaWidth,
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
  const Wrapper = includeMinimap ? MinimapWrapper : NullWrapper

  return renderToStaticMarkup(
    <SvgWrapper width={width} height={height}>
      <Wrapper model={model}>
        <CoreRendering
          Context={Context}
          model={model}
          theme={theme}
          offsetX={offsetX}
          offsetY={offsetY}
          width={width}
          height={height}
        />
      </Wrapper>
    </SvgWrapper>,
    createRoot,
  )
}

function CoreRendering({
  model,
  theme,
  width,
  height,
  offsetX,
  offsetY,
  Context,
}: {
  model: MsaViewModel
  theme: Theme
  width: number
  height: number
  offsetX: number
  offsetY: number
  Context: (
    width: number,
    height: number,
  ) => CanvasRenderingContext2D & { getSvg: () => { innerHTML: string } }
}) {
  const clipId1 = 'tree'
  const clipId2 = 'msa'
  const { treeAreaWidth, colorScheme } = model
  const contrastScheme = colorContrast(colorScheme, theme)
  const ctx1 = Context(width, height)
  const ctx2 = Context(width, height)
  renderBoxFeatureCanvasBlock({
    ctx: ctx2,
    offsetX,
    offsetY,
    model,
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })
  const msaAreaWidth = width - treeAreaWidth
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
    theme,
    offsetY,
    offsetX,
    contrastScheme,
    ctx: ctx2,
    blockSizeXOverride: msaAreaWidth,
    blockSizeYOverride: height,
    highResScaleFactorOverride: 1,
  })
  return (
    <>
      <defs>
        <clipPath id={clipId1}>
          <rect x={0} y={0} width={treeAreaWidth} height={height} />
        </clipPath>
      </defs>
      <defs>
        <clipPath id={clipId2}>
          <rect x={0} y={0} width={msaAreaWidth} height={height} />
        </clipPath>
      </defs>

      <g
        clipPath={`url(#${clipId1})`}
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: ctx1.getSvg().innerHTML }}
      />
      <g
        clipPath={`url(#${clipId2})`}
        transform={`translate(${treeAreaWidth} 0)`}
        /* eslint-disable-next-line react/no-danger */
        dangerouslySetInnerHTML={{ __html: ctx2.getSvg().innerHTML }}
      />
    </>
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

function SvgWrapper({
  width,
  height,
  children,
}: {
  width: number
  height: number
  children: React.ReactNode
}) {
  return (
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={[0, 0, width, height].toString()}
    >
      {children}
    </svg>
  )
}

function NullWrapper({ children }: { children: React.ReactNode }) {
  return children
}
