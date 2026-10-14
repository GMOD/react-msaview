const nodeFetchDispatcher = Symbol.for('undici.globalDispatcher.1')

// jsdom's undici 8 swaps the dispatcher Node's fetch reads for a wrapper that
// drops response headers, so fetch hands back gzip bytes undecoded
export async function loadJsdom() {
  const g = globalThis as Record<symbol, unknown>
  const own = g[nodeFetchDispatcher]
  const jsdom = await import('jsdom')
  g[nodeFetchDispatcher] = own
  return jsdom
}
