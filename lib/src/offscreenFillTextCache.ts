export function makeOffscreenFillTextCache(fontSize: number) {
  const rec = {} as Record<string, HTMLCanvasElement>
  for (let i = 32; i < 127; ++i) {
    const code = String.fromCharCode(i)
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = fontSize * 4
    offscreenCanvas.height = fontSize * 4
    const ctx = offscreenCanvas.getContext('2d')
    if (ctx) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'black'
      ctx.fillText(code, 0, 0)
    }
    rec[code] = offscreenCanvas
  }
  return rec
}
