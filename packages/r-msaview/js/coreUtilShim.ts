// The four helpers model.ts takes from the @jbrowse/core/util barrel, whose
// other exports pull React and MUI into a bundle that has no DOM to run them
export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

export function groupBy<T>(array: Iterable<T>, predicate: (v: T) => string) {
  const result: Record<string, T[]> = {}
  for (const value of array) {
    const key = predicate(value)
    ;(result[key] ??= []).push(value)
  }
  return result
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function sum(array: number[]) {
  let total = 0
  for (const n of array) {
    total += n
  }
  return total
}

export function fetchAndMaybeUnzipText(): never {
  throw new Error('the R bridge reads no files; R passes the text in')
}

export function openLocation(): never {
  throw new Error('the R bridge reads no files; R passes the text in')
}
