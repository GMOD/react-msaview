/// <reference types="vite/client" />
import { Box, Card, CardActionArea, Link, Typography } from '@mui/material'

import showcase from './showcase.json'

// the site serves docs/media beside the app; a dev server has no copy
const media = import.meta.env.DEV
  ? 'https://gmod.org/JBrowseMSA/media/'
  : '../media/'

type Key = keyof typeof showcase

const cards: { key: Key; title: string; text: string }[] = [
  {
    key: 'domains',
    title: 'Domains across a protein family',
    text: 'Twelve NLRP1 orthologs with their InterPro domains drawn on the alignment.',
  },
  {
    key: 'structure',
    title: 'An alignment beside its structure',
    text: 'Coronavirus spike proteins next to PDB 6VXX; hovering a column lights up the residue in 3D.',
  },
  {
    key: 'genes',
    title: 'Gene neighborhoods',
    text: 'The genes around trpB in each bacterial genome, drawn as arrows beside the TrpB alignment and lined up on trpE.',
  },
  {
    key: 'phylogeny',
    title: 'A virus phylogeny with metadata',
    text: 'A subsample of the Nextstrain RSV-A tree beside its genome alignment, with branches colored by clade from a row table.',
  },
]

function href(key: Key) {
  return `#data=${encodeURIComponent(JSON.stringify({ msaview: showcase[key].snapshot }))}`
}

function ExampleCard({ card }: { card: (typeof cards)[number] }) {
  return (
    <Card variant="outlined">
      <CardActionArea
        href={href(card.key)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          component="img"
          src={`${media}${showcase[card.key].figure}`}
          alt=""
          sx={{
            display: 'block',
            width: '100%',
            height: 110,
            objectFit: 'cover',
            objectPosition: 'left top',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        />
        <Box sx={{ p: 1.5, flex: 1 }}>
          <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600 }}>
            {card.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {card.text}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  )
}

export default function ExampleCards() {
  return (
    <Box>
      <Typography
        component="h2"
        sx={{ fontSize: 18, fontWeight: 600, mb: 1.5 }}
      >
        Or start from an example
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2,
        }}
      >
        {cards.map(card => (
          <ExampleCard key={card.key} card={card} />
        ))}
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5 }}>
        <Link href="../examples/">All examples</Link>
        {' · '}
        <Link href="../tutorials/">Tutorials that build each of these</Link>
      </Typography>
    </Box>
  )
}
