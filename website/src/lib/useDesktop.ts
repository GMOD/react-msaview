import { useSyncExternalStore } from 'react'

// Phones get a static screenshot instead of a live island, so they never
// download the viewer bundle. Only valid under `client:only`, since it reads
// `window` at import.
const desktopQuery = window.matchMedia('(min-width: 641px)')

function subscribe(cb: () => void) {
  desktopQuery.addEventListener('change', cb)
  return () => {
    desktopQuery.removeEventListener('change', cb)
  }
}

export function useDesktop() {
  return useSyncExternalStore(subscribe, () => desktopQuery.matches)
}
