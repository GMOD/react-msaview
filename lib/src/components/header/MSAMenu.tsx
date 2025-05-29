import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import { GridOn } from '@mui/icons-material'

import type { MsaViewModel } from '../../model'

const MSAMenu = observer(function ({ model }: { model: MsaViewModel }) {
  const { drawMsaLetters, contrastLettering, hideGaps, bgColor } = model
  return (
    <CascadingMenuButton
      closeAfterItemClick={false}
      menuItems={[
        {
          label: 'Draw letters',
          type: 'checkbox',
          checked: drawMsaLetters,
          onClick: () => {
            model.setDrawMsaLetters(!drawMsaLetters)
          },
        },
        {
          label: 'Color letters instead of background of tiles',
          type: 'checkbox',
          checked: !bgColor,
          onClick: () => {
            model.setBgColor(!bgColor)
          },
        },
        {
          label: 'Use contrast lettering',
          type: 'checkbox',
          checked: contrastLettering,
          onClick: () => {
            model.setContrastLettering(!contrastLettering)
          },
        },
        {
          label: 'Enable hiding gappy columns?',
          type: 'checkbox',
          checked: hideGaps,
          onClick: () => {
            model.setHideGaps(!hideGaps)
          },
        },
      ]}
    >
      <GridOn />
    </CascadingMenuButton>
  )
})

export default MSAMenu
