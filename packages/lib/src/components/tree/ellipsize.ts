const ellipsis = '…'

/**
 * the longest prefix of `text`, plus an ellipsis, that measures at most
 * `room` px; `width` is the full text's measured width
 */
export function ellipsize(
  measure: (text: string) => number,
  text: string,
  width: number,
  room: number,
) {
  if (width <= room) {
    return { text, width }
  }
  for (let n = Math.floor((text.length * room) / width); n > 0; n--) {
    const truncated = text.slice(0, n).trimEnd() + ellipsis
    const truncatedWidth = measure(truncated)
    if (truncatedWidth <= room) {
      return { text: truncated, width: truncatedWidth }
    }
  }
  return { text: '', width: 0 }
}
