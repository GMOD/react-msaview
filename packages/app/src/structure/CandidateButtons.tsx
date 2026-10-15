import { Box, Button } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { StructureCandidate } from 'react-msaview-structure'

export function candidateKey(m: {
  row: string
  structure: { id: string; asymId?: string }
}) {
  return `${m.row}\u0000${m.structure.id}\u0000${m.structure.asymId ?? ''}`
}

function CandidateButton({
  candidate,
  selected,
  color,
  title,
  onClick,
}: {
  candidate: StructureCandidate
  selected: boolean
  color: 'primary' | 'secondary'
  title: string
  onClick: () => void
}) {
  return (
    <Button
      size="small"
      variant="contained"
      color={color}
      disableElevation
      aria-pressed={selected}
      title={title}
      onClick={onClick}
      sx={
        selected
          ? undefined
          : {
              color: `${color}.dark`,
              bgcolor: theme => alpha(theme.palette[color].main, 0.14),
              '&:hover': {
                bgcolor: theme => alpha(theme.palette[color].main, 0.24),
              },
            }
      }
    >
      {candidate.label}
    </Button>
  )
}

export default function CandidateButtons({
  candidates,
  shownId,
  color,
  titleOf,
  onPick,
}: {
  candidates: StructureCandidate[]
  shownId: string | undefined
  color: 'primary' | 'secondary'
  titleOf: (candidate: StructureCandidate) => string
  onPick: (candidate: StructureCandidate) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
      {candidates.map(candidate => (
        <CandidateButton
          key={candidateKey(candidate.mapping)}
          candidate={candidate}
          selected={candidate.mapping.structure.id === shownId}
          color={color}
          title={titleOf(candidate)}
          onClick={() => {
            onPick(candidate)
          }}
        />
      ))}
    </Box>
  )
}
