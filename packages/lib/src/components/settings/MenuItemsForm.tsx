import React, { useState } from 'react'

import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import ArrowRight from '@mui/icons-material/ArrowRight'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material'

import type { MenuItem } from '@jbrowse/core/ui/Menu'

// The menus' item builders drive the settings panel too, so a setting is
// written once: a checkbox item renders as a checkbox, a radio as a radio, a
// submenu as a section that opens in place, and an action as a button
function label(item: MenuItem & { icon?: React.ElementType }) {
  const { icon: Icon } = item
  const text = 'label' in item ? item.label : ''
  return Icon ? (
    <Box
      component="span"
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <Icon />
      {text}
    </Box>
  ) : (
    text
  )
}

function SubSection({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false)
  if (!('subMenu' in item) || !Array.isArray(item.subMenu)) {
    return null
  }
  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={open ? <ArrowDropDown /> : <ArrowRight />}
        onClick={() => {
          setOpen(!open)
        }}
        sx={{ textTransform: 'none', justifyContent: 'flex-start', px: 0.5 }}
      >
        {item.label}
      </Button>
      {open ? (
        <Box sx={{ pl: 2 }}>
          <MenuItemsForm items={item.subMenu} />
        </Box>
      ) : null}
    </>
  )
}

export default function MenuItemsForm({ items }: { items: MenuItem[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => {
        const key = 'label' in item ? String(item.label) : String(i)
        if (!('label' in item)) {
          return null
        }
        if ('type' in item && item.type === 'subHeader') {
          return (
            <Typography key={key} variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          )
        }
        if ('subMenu' in item) {
          return <SubSection key={key} item={item} />
        }
        const onClick = 'onClick' in item ? item.onClick : undefined
        if (
          'type' in item &&
          (item.type === 'checkbox' || item.type === 'radio')
        ) {
          const Control = item.type === 'checkbox' ? Checkbox : Radio
          return (
            <FormControlLabel
              key={key}
              disabled={item.disabled}
              control={
                <Control
                  size="small"
                  checked={item.checked}
                  onChange={() => onClick?.()}
                  sx={{ py: 0.25 }}
                />
              }
              label={label(item)}
              slotProps={{ typography: { variant: 'body2' } }}
            />
          )
        }
        return (
          <Button
            key={key}
            size="small"
            disabled={item.disabled}
            onClick={() => onClick?.()}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            {item.label}
          </Button>
        )
      })}
    </Box>
  )
}
