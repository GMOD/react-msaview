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
    text: 'Twelve NLRP1 orthologs with their InterPro domains drawn on the alignment. The pyrin domain at the left sits on five of the twelve rows, and the mouse protein lacks it.',
  },
  {
    key: 'structure',
    title: 'An alignment beside its structure',
    text: 'Coronavirus spike proteins next to PDB 6VXX. A track marks which SARS-CoV-2 residues the structure resolved, and hovering a column lights up the residue in 3D.',
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

function ExampleCard({
  card,
  featured,
}: {
  card: (typeof cards)[number]
  featured?: boolean
}) {
  return (
    <Card
      variant="outlined"
      sx={featured ? { gridColumn: '1 / -1' } : undefined}
    >
      <CardActionArea
        href={href(card.key)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: featured ? 'row' : 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          '@media (max-width: 640px)': { flexDirection: 'column' },
        }}
      >
        <Box
          component="img"
          src={`${media}${showcase[card.key].figure}`}
          alt=""
          sx={{
            display: 'block',
            width: featured ? '60%' : '100%',
            height: featured ? 260 : 150,
            objectFit: 'cover',
            objectPosition: 'left top',
            borderBottom: featured ? 0 : 1,
            borderRight: featured ? 1 : 0,
            borderColor: 'divider',
            '@media (max-width: 640px)': { width: '100%', height: 150 },
          }}
        />
        <Box sx={{ p: 2, flex: 1 }}>
          <Typography
            component="h2"
            sx={{ fontSize: featured ? 20 : 16, fontWeight: 600, mb: 0.5 }}
          >
            {card.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {card.text}
          </Typography>
          {featured ? (
            <Typography sx={{ mt: 2, fontWeight: 600 }} color="primary">
              Open this example →
            </Typography>
          ) : null}
        </Box>
      </CardActionArea>
    </Card>
  )
}

export default function ExampleCards() {
  const [first, ...rest] = cards
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 2,
        }}
      >
        <ExampleCard card={first!} featured />
        {rest.map(card => (
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
