import React from 'react'

import ArrowDropDown from '@mui/icons-material/ArrowDropDown'

import type { SxProps, Theme } from '@mui/material'

// CascadingMenuButton renders an IconButton on every core a host may ship, so
// these styles give it the look of a small text Button
export const menuButtonSx: SxProps<Theme> = {
  borderRadius: 1,
  typography: 'button',
  color: 'text.primary',
  pl: 1,
  pr: 0.5,
  py: 0.5,
}

export default function MenuButtonLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ArrowDropDown fontSize="small" />
    </>
  )
}
