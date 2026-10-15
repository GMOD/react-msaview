import React from 'react'

import { Checkbox, FormControlLabel, Tooltip } from '@mui/material'
import { observer } from 'mobx-react'

import type { MsaViewModel } from '../../model.ts'

// the label and the control jbrowse-components' ScrollZoomToggle uses, kept
// local because a host's older core lacks that export
export const scrollZoomLabel = 'Zoom on scroll'

export const scrollZoomHelp =
  'The mouse wheel zooms the alignment instead of scrolling it; shift+scroll still scrolls. ctrl+scroll (⌘+scroll on a Mac) zooms either way.'

const ScrollZoomCheckbox = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  return (
    <Tooltip title={scrollZoomHelp} describeChild>
      <FormControlLabel
        data-testid="scroll-zoom-toggle"
        style={{ marginLeft: 4, marginRight: 8, whiteSpace: 'nowrap' }}
        control={
          <Checkbox
            size="small"
            checked={model.scrollZoom}
            onChange={() => {
              model.setScrollZoom(!model.scrollZoom)
            }}
            style={{ padding: 6 }}
          />
        }
        label={scrollZoomLabel}
        slotProps={{ typography: { variant: 'body2' } }}
      />
    </Tooltip>
  )
})

export default ScrollZoomCheckbox
