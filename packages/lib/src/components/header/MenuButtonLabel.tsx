import React from 'react'

import ArrowDropDown from '@mui/icons-material/ArrowDropDown'

export default function MenuButtonLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: 15,
        paddingLeft: 4,
      }}
    >
      {children}
      <ArrowDropDown fontSize="small" />
    </span>
  )
}
