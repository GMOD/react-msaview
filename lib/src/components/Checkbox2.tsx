import React from 'react'
import {
  Checkbox,
  FormControlLabel,
  FormControlLabelProps,
} from '@mui/material'

function FormControlLabel2(rest: FormControlLabelProps) {
  return (
    <div>
      <FormControlLabel {...rest} />
    </div>
  )
}
export default function Checkbox2({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <FormControlLabel2
      control={<Checkbox checked={checked} onChange={onChange} />}
      label={label}
    />
  )
}
