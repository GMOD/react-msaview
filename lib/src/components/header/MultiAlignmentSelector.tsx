import React from 'react'
import { observer } from 'mobx-react'
import { Select } from '@mui/material'

// locals
import { MsaViewModel } from '../../model'

const MultiAlignmentSelector = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  const { currentAlignment, alignmentNames } = model
  return alignmentNames.length > 0 ? (
    <Select
      native
      value={currentAlignment}
      size="small"
      onChange={event => {
        model.setCurrentAlignment(+(event.target.value as string))
        model.setScrollX(0)
        model.setScrollY(0)
      }}
    >
      {alignmentNames.map((option, index) => (
        <option key={`${option}-${index}`} value={index}>
          {option}
        </option>
      ))}
    </Select>
  ) : null
})
export default MultiAlignmentSelector
