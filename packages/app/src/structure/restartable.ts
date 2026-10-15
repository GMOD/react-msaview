import { useEffect, useRef } from 'react'

export function messageOf(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export function signalledFetchText(signal: AbortSignal) {
  return async (url: string) => {
    const res = await fetch(url, { signal })
    if (!res.ok) {
      throw new Error(`${url}: HTTP ${res.status}`)
    }
    return res.text()
  }
}

/**
 * One abortable run at a time: `restart` aborts the run before it and hands
 * out a fresh signal, and unmounting aborts whatever is running.
 */
export function useRestartable() {
  const current = useRef<AbortController | undefined>(undefined)
  useEffect(
    () => () => {
      current.current?.abort()
    },
    [],
  )
  return {
    restart() {
      current.current?.abort()
      const controller = new AbortController()
      current.current = controller
      return controller.signal
    },
    abort() {
      current.current?.abort()
    },
  }
}
