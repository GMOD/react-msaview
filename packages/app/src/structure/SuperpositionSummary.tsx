import { Alert } from '@mui/material'

import type { Superposition } from './useSuperposition'

export default function SuperpositionSummary({
  superposition,
}: {
  superposition: Superposition
}) {
  if (superposition.state === 'error') {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {superposition.message}
      </Alert>
    )
  }
  if (superposition.state === 'tm') {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {superposition.fits
          ? Object.entries(superposition.fits)
              .map(
                ([id, f]) =>
                  `${id}: TM-score ${f.tmScore.toFixed(2)}, ${f.rmsd.toFixed(2)} Å over ${f.alignedLength} residues`,
              )
              .join(' · ')
          : 'Aligning by structure'}
      </Alert>
    )
  }
  if (superposition.state === 'done') {
    const { result, problems } = superposition
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {result.fits
          .map(
            f =>
              `${f.row}: ${f.rmsd.toFixed(2)} Å over ${f.fitted} of ${f.considered} aligned CA pairs`,
          )
          .join(' · ')}
        {result.skipped.length > 0
          ? ` · skipped ${result.skipped.map(k => `${k.row} (${k.reason})`).join('; ')}`
          : ''}
        {problems.length > 0 ? ` · ${problems.join('; ')}` : ''}
      </Alert>
    )
  }
  return null
}
