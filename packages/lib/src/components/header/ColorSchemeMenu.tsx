import React from 'react'

import CascadingMenuButton from '@jbrowse/core/ui/CascadingMenuButton'
import { observer } from 'mobx-react'

import colorSchemes from '../../colorSchemes.ts'
import MenuButtonLabel from './MenuButtonLabel.tsx'

import type { MsaViewModel } from '../../model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

type Alphabet = 'any' | 'nucleotide' | 'protein'

interface SchemeEntry {
  name: string
  label: string
  alphabet: Alphabet
  // the static scheme a swatch borrows its colors from
  swatchFrom?: string
}

const schemeGroups: { title: string; entries: SchemeEntry[] }[] = [
  {
    title: 'Any alignment',
    entries: [
      { name: 'none', label: 'None', alphabet: 'any' },
      {
        name: 'percent_identity_dynamic',
        label: 'Percent identity',
        alphabet: 'any',
      },
    ],
  },
  {
    title: 'Nucleotide',
    entries: [
      { name: 'nucleotide', label: 'Nucleotide', alphabet: 'nucleotide' },
      { name: 'clustalx_dna', label: 'Clustal X', alphabet: 'nucleotide' },
      { name: 'rainbow_dna', label: 'Rainbow', alphabet: 'nucleotide' },
      { name: 'jbrowse_dna', label: 'JBrowse', alphabet: 'nucleotide' },
    ],
  },
  {
    title: 'Protein',
    entries: [
      { name: 'maeditor', label: 'MAEditor', alphabet: 'protein' },
      { name: 'clustal', label: 'Clustal', alphabet: 'protein' },
      { name: 'clustalx_protein', label: 'Clustal X', alphabet: 'protein' },
      {
        name: 'clustalx_protein_dynamic',
        label: 'Clustal X, by column conservation',
        alphabet: 'protein',
        swatchFrom: 'clustalx_protein',
      },
      { name: 'lesk', label: 'Lesk', alphabet: 'protein' },
      { name: 'flower', label: 'Flower', alphabet: 'protein' },
      { name: 'cinema', label: 'Cinema', alphabet: 'protein' },
      { name: 'jalview_zappo', label: 'Zappo', alphabet: 'protein' },
      { name: 'jalview_taylor', label: 'Taylor', alphabet: 'protein' },
    ],
  },
  {
    title: 'Protein property',
    entries: [
      {
        name: 'jalview_hydrophobicity',
        label: 'Hydrophobicity',
        alphabet: 'protein',
      },
      { name: 'jalview_buried', label: 'Buried index', alphabet: 'protein' },
      {
        name: 'jalview_prophelix',
        label: 'Helix propensity',
        alphabet: 'protein',
      },
      {
        name: 'jalview_propstrand',
        label: 'Strand propensity',
        alphabet: 'protein',
      },
      {
        name: 'jalview_propturn',
        label: 'Turn propensity',
        alphabet: 'protein',
      },
    ],
  },
]

const swatchLetters: Record<Alphabet, string[]> = {
  any: [],
  nucleotide: ['A', 'C', 'G', 'T'],
  protein: ['A', 'L', 'K', 'D', 'N', 'G', 'P', 'W'],
}

function makeSwatch(entry: SchemeEntry) {
  const map = colorSchemes[entry.swatchFrom ?? entry.name]
  const colors = swatchLetters[entry.alphabet]
    .map(l => map?.[l])
    .filter(c => c !== undefined)
  if (colors.length === 0) {
    return undefined
  }
  const w = 24 / colors.length
  return function Swatch() {
    return (
      <svg width={24} height={14} aria-hidden>
        {colors.map((c, i) => (
          <rect key={c + i} x={i * w} width={w} height={14} fill={c} />
        ))}
      </svg>
    )
  }
}

const swatches = new Map(
  schemeGroups.flatMap(g => g.entries.map(e => [e.name, makeSwatch(e)])),
)

export const catalogedSchemeNames = [...swatches.keys()]

function fitsAlphabet(model: MsaViewModel, alphabet: Alphabet) {
  return (
    alphabet === 'any' ||
    (alphabet === 'protein') === (model.sequenceType === 'amino')
  )
}

// While a `customColorScheme` map is set, a checked Custom entry stands for it
// and no named scheme is checked. Picking a named scheme clears the map. The
// schemes for the other alphabet go in a submenu at the end, except the
// checked one, which stays at the top level.
export function colorSchemeMenuItems(model: MsaViewModel): MenuItem[] {
  const { colorSchemeName, customColorScheme } = model
  function radio(entry: SchemeEntry) {
    return {
      label: entry.label,
      type: 'radio',
      icon: swatches.get(entry.name),
      checked: !customColorScheme && colorSchemeName === entry.name,
      onClick: () => {
        model.setColorSchemeName(entry.name)
      },
    } as const
  }
  const shown = (e: SchemeEntry) =>
    fitsAlphabet(model, e.alphabet) || e.name === colorSchemeName
  const others = schemeGroups.flatMap(g =>
    g.entries.filter(e => !shown(e)).map(e => radio(e)),
  )
  return [
    ...(customColorScheme
      ? [
          {
            label: 'Custom',
            type: 'radio',
            checked: true,
            onClick: () => {},
          } as const,
        ]
      : []),
    ...schemeGroups.flatMap(g => {
      const entries = g.entries.filter(shown)
      return entries.length > 0
        ? [
            { type: 'subHeader', label: g.title } as const,
            ...entries.map(e => radio(e)),
          ]
        : []
    }),
    ...(others.length > 0
      ? [
          { type: 'divider' } as const,
          {
            label:
              model.sequenceType === 'amino'
                ? 'Nucleotide schemes'
                : 'Protein schemes',
            type: 'subMenu',
            subMenu: others,
          } as const,
        ]
      : []),
    { type: 'divider' },
    {
      label: 'Color letters, not cells',
      type: 'checkbox',
      checked: !model.bgColor,
      onClick: () => {
        model.setBgColor(!model.bgColor)
      },
    },
  ]
}

const ColorSchemeMenu = observer(function ({ model }: { model: MsaViewModel }) {
  return (
    <CascadingMenuButton
      data-testid="color_scheme_menu"
      tooltip="Color scheme"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      menuItems={colorSchemeMenuItems(model)}
      sx={{ borderRadius: 1 }}
    >
      <MenuButtonLabel>Color</MenuButtonLabel>
    </CascadingMenuButton>
  )
})

export default ColorSchemeMenu
