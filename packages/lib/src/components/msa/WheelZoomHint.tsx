import React, { useCallback, useRef, useState } from 'react'

import { Paper, Typography } from '@mui/material'

import type { MsaViewModel } from '../../model.ts'

const hinted = new WeakSet<MsaViewModel>()

const zoomKey =
  typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac')
    ? '⌘'
    : 'Ctrl'

export function useWheelZoomHint(model: MsaViewModel) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onWheelScroll = useCallback(
    (event: WheelEvent) => {
      if (
        !model.scrollZoom &&
        Math.abs(event.deltaY) > Math.abs(event.deltaX) &&
        !hinted.has(model)
      ) {
        hinted.add(model)
        setVisible(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          setVisible(false)
        }, 2500)
      }
    },
    [model],
  )
  return { visible, onWheelScroll }
}

export function WheelZoomHint() {
  return (
    <Paper
      elevation={3}
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '4px 12px',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <Typography variant="body2">
        {zoomKey} + scroll to zoom, or check Zoom on scroll
      </Typography>
    </Paper>
  )
}
