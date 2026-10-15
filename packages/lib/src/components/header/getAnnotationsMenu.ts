import { lazy } from 'react'

import type { MsaViewModel } from '../../model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

const FeatureFilterDialog = lazy(() => import('../dialogs/FeatureDialog.tsx'))
const AnnotationFileDialog = lazy(
  () => import('../dialogs/AnnotationFileDialog.tsx'),
)

export function openAnnotationFileItem(model: MsaViewModel): MenuItem {
  return {
    label: 'Open annotation file…',
    onClick: () => {
      model.queueDialog(handleClose => [
        AnnotationFileDialog,
        { handleClose, model },
      ])
    },
  }
}

export function annotationsSubMenu(model: MsaViewModel): MenuItem[] {
  const { showDomains, actuallyShowDomains, subFeatureRows } = model
  return [
    {
      label: 'Show annotations',
      type: 'checkbox',
      checked: actuallyShowDomains,
      onClick: () => {
        model.setShowDomains(!showDomains)
      },
    },
    {
      label: 'Sub-row layout',
      type: 'checkbox',
      disabled: !actuallyShowDomains,
      checked: actuallyShowDomains && subFeatureRows,
      onClick: () => {
        model.setSubFeatureRows(!subFeatureRows)
      },
    },
    ...typeItems(model),
  ]
}

// up to this many types list inline, one checkbox each; past it the filter
// dialog, which searches and counts them, takes over
const inlineTypes = 12

function typeItems(model: MsaViewModel): MenuItem[] {
  const types = [...model.annotationTypes.values()]
  return types.length <= inlineTypes
    ? [
        { type: 'subHeader', label: 'Types' },
        ...types.map(({ accession, name }) => ({
          label: name || accession,
          type: 'checkbox' as const,
          checked: !model.featureOff(accession),
          onClick: () => {
            model.setFilter(accession, model.featureOff(accession))
          },
        })),
      ]
    : [
        {
          label: 'Filter annotations…',
          onClick: () => {
            model.queueDialog(onClose => [
              FeatureFilterDialog,
              { onClose, model },
            ])
          },
        },
      ]
}
