import { setFontSize } from './setFontSize.ts'

// Cached across calls, since both createElement and getContext are far more
// expensive than measureText.
// `null` records that this environment has no 2d context, so the lookup is not
// retried on every label.
let ctxHandle: CanvasRenderingContext2D | null | undefined

function getCtx() {
  if (ctxHandle === undefined) {
    ctxHandle =
      typeof document === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d')
  }
  return ctxHandle
}

/**
 * Rough average glyph width as a fraction of the font size for the sans-serif
 * stack the labels use. measureTextCanvas falls back on it where there is no
 * canvas to measure with (jsdom, SSR), and the headless render environment's
 * `measureText` reports it.
 */
export const CHAR_WIDTH_RATIO = 0.6

export function measureTextCanvas(text: string, fontSize: number) {
  const ctx = getCtx()
  if (!ctx) {
    return text.length * fontSize * CHAR_WIDTH_RATIO
  }
  setFontSize(ctx, fontSize)
  return ctx.measureText(text).width
}
