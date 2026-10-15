import React from 'react'

import colorSchemes from '../../colorSchemes.ts'

import type { MsaViewModel } from '../../model.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

type Alphabet = 'any' | 'nucleotide' | 'protein'

interface SchemeEntry {
  name: string
  label: string
  alphabet: Alphabet
  // the static scheme a swatch borrows its colors from
  swatchFrom?: string
  // shown at the top level for its alphabet, the rest under More schemes
  featured?: boolean
}

const schemes: SchemeEntry[] = [
  { name: 'maeditor', label: 'MAEditor', alphabet: 'protein', featured: true },
  {
    name: 'clustalx_protein',
    label: 'Clustal X',
    alphabet: 'protein',
    featured: true,
  },
  {
    name: 'clustalx_protein_dynamic',
    label: 'Clustal X, by column conservation',
    alphabet: 'protein',
    swatchFrom: 'clustalx_protein',
    featured: true,
  },
  {
    name: 'jalview_hydrophobicity',
    label: 'Hydrophobicity',
    alphabet: 'protein',
    featured: true,
  },
  {
    name: 'nucleotide',
    label: 'Nucleotide',
    alphabet: 'nucleotide',
    featured: true,
  },
  {
    name: 'rainbow_dna',
    label: 'Rainbow',
    alphabet: 'nucleotide',
    featured: true,
  },
  {
    name: 'percent_identity_dynamic',
    label: 'Percent identity',
    alphabet: 'any',
    featured: true,
  },
  { name: 'none', label: 'None', alphabet: 'any', featured: true },
  { name: 'clustal', label: 'Clustal', alphabet: 'protein' },
  { name: 'lesk', label: 'Lesk', alphabet: 'protein' },
  { name: 'flower', label: 'Flower', alphabet: 'protein' },
  { name: 'cinema', label: 'Cinema', alphabet: 'protein' },
  { name: 'jalview_zappo', label: 'Zappo', alphabet: 'protein' },
  { name: 'jalview_taylor', label: 'Taylor', alphabet: 'protein' },
  { name: 'jalview_buried', label: 'Buried index', alphabet: 'protein' },
  { name: 'jalview_prophelix', label: 'Helix propensity', alphabet: 'protein' },
  {
    name: 'jalview_propstrand',
    label: 'Strand propensity',
    alphabet: 'protein',
  },
  { name: 'jalview_propturn', label: 'Turn propensity', alphabet: 'protein' },
  { name: 'clustalx_dna', label: 'Clustal X (DNA)', alphabet: 'nucleotide' },
  { name: 'jbrowse_dna', label: 'JBrowse (DNA)', alphabet: 'nucleotide' },
]

export const catalogedSchemeNames = schemes.map(s => s.name)

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

const swatches = new Map(schemes.map(e => [e.name, makeSwatch(e)]))

// While a `customColorScheme` map is set, a checked Custom entry stands for it
// and no named scheme is checked. Picking a named scheme clears the map. The
// active scheme always shows at the top level.
export function colorSchemeMenuItems(model: MsaViewModel): MenuItem[] {
  const { colorSchemeName, customColorScheme, sequenceType } = model
  const alphabet = sequenceType === 'amino' ? 'protein' : 'nucleotide'
  function radio(entry: SchemeEntry) {
    return {
      label: entry.label,
      type: 'radio',
      icon: swatches.get(entry.name),
      checked: !customColorScheme && colorSchemeName === entry.name,
      onClick: () => {
        model.setColorSchemeName(entry.name)
        // a scheme picked while the domains fill the cells would color
        // nothing, so the pick hands the cells back to the residues
        if (model.cellFill === 'domain') {
          model.setCellFill('residue')
        }
      },
    } as const
  }
  const top = (e: SchemeEntry) =>
    (e.featured && (e.alphabet === 'any' || e.alphabet === alphabet)) ||
    (!customColorScheme && e.name === colorSchemeName)
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
    ...schemes.filter(top).map(radio),
    {
      label: 'More schemes',
      type: 'subMenu',
      subMenu: schemes.filter(e => !top(e)).map(radio),
    },
  ]
}
