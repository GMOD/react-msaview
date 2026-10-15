import React from 'react'

import { referenceFieldLabels } from './metadataLabels.ts'

const referenceTags = ['RM', 'RT', 'RA', 'RL', 'RC'] as const

function pubmed(id: string) {
  return /^\d+$/.test(id) ? (
    <a
      href={`https://pubmed.ncbi.nlm.nih.gov/${id}/`}
      target="_blank"
      rel="noreferrer"
    >
      {id}
    </a>
  ) : (
    id
  )
}

function groupReferences(general: Record<string, unknown>) {
  const numbers = general.RN
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return general
  }
  const present = referenceTags.filter(tag => general[tag] != null)
  const aligned = present.every(tag => {
    const values = general[tag]
    return Array.isArray(values) && values.length === numbers.length
  })
  if (!aligned) {
    return general
  }
  const rest = Object.fromEntries(
    Object.entries(general).filter(
      ([tag]) =>
        tag !== 'RN' && !(referenceTags as readonly string[]).includes(tag),
    ),
  )
  const references = Object.fromEntries(
    numbers.map((number: string, i) => [
      number,
      Object.fromEntries(
        present.map(tag => {
          const value = (general[tag] as string[])[i]!
          return [
            referenceFieldLabels[tag],
            tag === 'RM' ? pubmed(value) : value,
          ]
        }),
      ),
    ]),
  )
  return { ...rest, References: references }
}

export function groupGeneral(general: unknown) {
  return general && typeof general === 'object'
    ? groupReferences(general as Record<string, unknown>)
    : {}
}
