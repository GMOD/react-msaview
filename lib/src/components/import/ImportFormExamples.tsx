import React from 'react'
import { Typography, Link } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../../model'
import { smallTree, smallMSA, smallMSAOnly } from './data/seq2'
import { load } from './util'

const ListItem = ({
  onClick,
  model,
  children,
}: {
  onClick: () => void
  model: MsaViewModel
  children: React.ReactNode
}) => (
  <li>
    <Link
      onClick={event => {
        model.setError(undefined)
        event.preventDefault()
        onClick()
      }}
      href="#"
    >
      <Typography display="inline">{children}</Typography>
    </Link>
  </li>
)

const ImportFormExamples = observer(function ({
  model,
}: {
  model: MsaViewModel
}) {
  return (
    <ul>
      <ListItem
        model={model}
        onClick={() =>
          load(model, undefined, {
            uri: 'https://jbrowse.org/genomes/newick_trees/sarscov2phylo.pub.ft.nh',
            locationType: 'UriLocation',
          })
        }
      >
        230k COVID-19 samples (tree only)
      </ListItem>
      <ListItem
        model={model}
        onClick={() => {
          model.setData({ msa: smallMSA, tree: smallTree })
        }}
      >
        Small protein MSA+tree
      </ListItem>
      <ListItem
        model={model}
        onClick={() => {
          model.setData({ msa: smallMSAOnly })
        }}
      >
        Small MSA only
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(model, {
            uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/pfam-cov2.stock',
            locationType: 'UriLocation',
          })
        }
      >
        PFAM SARS-CoV2 multi-stockholm
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(model, {
            uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/Lysine.stock',
            locationType: 'UriLocation',
          })
        }
      >
        Lysine stockholm file
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(model, {
            uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/PF01601_full.txt',
            locationType: 'UriLocation',
          })
        }
      >
        PF01601 stockholm file (SARS-CoV2 spike protein)
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(model, {
            uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/europe_covid.fa',
            locationType: 'UriLocation',
          })
        }
      >
        Europe COVID full genomes (LR883044.1 and 199 other sequences)
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(
            model,
            {
              uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.fa',
              locationType: 'UriLocation',
            },
            {
              uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.nh',
              locationType: 'UriLocation',
            },
          )
        }
      >
        MAFFT+VeryFastTree(17.9k samples)
      </ListItem>
      <ListItem
        model={model}
        onClick={() =>
          load(model, {
            uri: 'https://jbrowse.org/demos/ttc39a.mfa',
            locationType: 'UriLocation',
          })
        }
      >
        Human BLAST results mfa
      </ListItem>
    </ul>
  )
})

export default ImportFormExamples
