import { CircularProgress, Typography } from '@mui/material'
import React from 'react'
export default function Loading() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
      }}
    >
      <CircularProgress />
      <Typography>Loading...</Typography>
    </div>
  )
}
