import React, { useState } from 'react'

import { Autocomplete, TextField } from '@mui/material'
import { observer } from 'mobx-react'

import { findableRowNames, goTo, rowNameSuggestions } from './goTo.ts'

import type { MsaViewModel } from '../../model.ts'
import type { AutocompleteRenderInputParams } from '@mui/material'

const label = 'Go to row or column'

// MUI 9 hands renderInput `slotProps`; MUI 7, which every released JBrowse host
// serves, hands it `inputProps` and no `slotProps` at all
export function labelledInput(params: AutocompleteRenderInputParams) {
  const { slotProps, inputProps } = params as Partial<
    AutocompleteRenderInputParams & { inputProps: object }
  >
  return slotProps
    ? {
        slotProps: {
          ...slotProps,
          htmlInput: { ...slotProps.htmlInput, 'aria-label': label },
        },
      }
    : { inputProps: { ...inputProps, 'aria-label': label } }
}

// the menu that opens the dialog hands focus back to its button as it closes,
// after an autoFocus input would have taken it
function focusNextFrame(el: HTMLInputElement | null) {
  if (el) {
    requestAnimationFrame(() => {
      el.focus()
    })
  }
}

export function canGoTo(model: MsaViewModel) {
  return findableRowNames(model).length > 1 || model.numColumns > 0
}

const GoToBox = observer(function ({
  model,
  onFound,
}: {
  model: MsaViewModel
  onFound?: () => void
}) {
  const [missed, setMissed] = useState(false)
  return (
    <Autocomplete
      freeSolo
      options={findableRowNames(model)}
      filterOptions={(options, { inputValue }) =>
        rowNameSuggestions(options, inputValue)
      }
      value={null}
      blurOnSelect
      onInputChange={() => {
        setMissed(false)
      }}
      onChange={(_, text) => {
        if (text) {
          const found = goTo(model, text)
          setMissed(!found)
          if (found) {
            onFound?.()
          }
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          inputRef={focusNextFrame}
          error={missed}
          placeholder="Row name or column number"
          helperText={
            missed
              ? 'No row or column matches'
              : 'Or name:N for residue N of that row'
          }
          {...labelledInput(params)}
        />
      )}
    />
  )
})

export default GoToBox
