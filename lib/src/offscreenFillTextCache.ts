export function makeOffscreenFillTextCache(fontSize: number) {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = fontSize * 4 * (127 - 32)
  offscreenCanvas.height = fontSize * 8
  const ctx = offscreenCanvas.getContext('2d')

  if (ctx) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'black'
    for (let i = 32; i < 127; ++i) {
      const x = i - 32
      const code = String.fromCharCode(i)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'black'
      ctx.fillText(code, x * fontSize * 4, 0)
    }
    ctx.fillStyle = 'white'
    for (let i = 32; i < 127; ++i) {
      const x = i - 32
      const code = String.fromCharCode(i)
      ctx.fillText(code, x * fontSize * 4, fontSize * 4)
    }
  }
  return offscreenCanvas
}

export function drawLetter(
  src: HTMLCanvasElement,
  dest: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
) {
  const code = letter.charCodeAt(0)
  if (color === 'black' || color === 'rgba(0, 0, 0, 0.87)') {
    dest.drawImage(
      src,
      (code - 32) * fontSize * 4,
      0,
      fontSize * 4,
      fontSize * 4,
      x,
      y,
      fontSize * 4,
      fontSize * 4,
    )
  } else if (color === 'white' || color === '#fff') {
    dest.drawImage(
      src,
      (code - 32) * fontSize * 4,
      fontSize * 4,
      fontSize * 4,
      fontSize * 4,
      x,
      y,
      fontSize * 4,
      fontSize * 4,
    )
  }
}
