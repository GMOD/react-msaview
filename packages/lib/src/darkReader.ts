import { useSyncExternalStore } from 'react'

import { createJBrowseTheme } from '@jbrowse/core/ui/theme'
import { useTheme } from '@mui/material'

import type { Theme } from '@mui/material'

// Dark Reader's Dynamic mode rewrites the page's CSS and leaves canvas pixels
// alone, so a light theme's black letters land on the dark page it paints.
// Inlined from @jbrowse/core/util/systemColorScheme, which an older host core
// lacks (see CLAUDE.md on externals).
const DARK_READER_ATTRIBUTE = 'data-darkreader-scheme'

function darkReaderIsDark() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute(DARK_READER_ATTRIBUTE) === 'dark'
  )
}

function onDarkReaderChange(listener: () => void) {
  if (
    typeof MutationObserver !== 'function' ||
    typeof document === 'undefined'
  ) {
    return () => {}
  }
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [DARK_READER_ATTRIBUTE],
  })
  return () => {
    observer.disconnect()
  }
}

let darkTheme: Theme | undefined

/**
 * The theme a canvas draws in: the surrounding MUI theme, or a dark one while
 * Dark Reader darkens a light page. The DOM keeps the surrounding theme, which
 * Dark Reader restyles itself, and the SVG export keeps it too.
 */
export function useCanvasTheme() {
  const theme = useTheme()
  const darkReader = useSyncExternalStore(
    onDarkReaderChange,
    darkReaderIsDark,
    () => false,
  )
  if (darkReader && theme.palette.mode !== 'dark') {
    darkTheme ??= createJBrowseTheme({ palette: { mode: 'dark' } })
    return darkTheme
  }
  return theme
}
