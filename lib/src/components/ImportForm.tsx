import React, { useState } from 'react'
import { Button, Container, Grid, Typography, Link } from '@mui/material'
import { observer } from 'mobx-react'
import { transaction } from 'mobx'
import { FileSelector } from '@jbrowse/core/ui'
import { FileLocation } from '@jbrowse/core/util/types'

// locals
import { MsaViewModel } from '../model'
import { smallTree, smallMSA, smallMSAOnly } from './data/seq2'

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
export default observer(({ model }: { model: MsaViewModel }) => {
  const [msaFile, setMsaFile] = useState<FileLocation>()
  const [treeFile, setTreeFile] = useState<FileLocation>()
  const { error } = model

  return (
    <Container>
      <div style={{ width: '50%' }}>
        {error ? (
          <div style={{ padding: 20 }}>
            <Typography color="error">Error: {`${error}`}</Typography>
          </div>
        ) : null}
        <Typography>
          Open an MSA file (stockholm or clustal format) and/or a tree file
          (newick format).
        </Typography>
        <Typography color="error">
          Note: you can open up just an MSA or just a tree, both are not
          required. Some MSA files e.g. stockholm format have an embedded tree
          also and this is fine, and opening a separate tree file is not
          required.
        </Typography>
      </div>

      <Grid container spacing={10} justifyContent="center" alignItems="center">
        <Grid item>
          <Typography>MSA file or URL</Typography>
          <FileSelector location={msaFile} setLocation={setMsaFile} />
          <Typography>Tree file or URL</Typography>
          <FileSelector location={treeFile} setLocation={setTreeFile} />
        </Grid>

        <Grid item>
          <Button
            onClick={() => {
              model.setError(undefined)
              if (msaFile) {
                model.setMSAFilehandle(msaFile)
              }
              if (treeFile) {
                model.setTreeFilehandle(treeFile)
              }
            }}
            variant="contained"
            color="primary"
            disabled={!msaFile && !treeFile}
          >
            Open
          </Button>
        </Grid>

        <Grid item>
          <Typography>Examples</Typography>
          <ul>
            <ListItem
              model={model}
              onClick={() => {
                model.setTreeFilehandle({
                  uri: 'https://jbrowse.org/genomes/newick_trees/sarscov2phylo.pub.ft.nh',
                  locationType: 'UriLocation',
                })
              }}
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
              onClick={() => {
                model.setMSAFilehandle({
                  uri: 'https://ihh.github.io/abrowse/build/pfam-cov2.stock',
                  locationType: 'UriLocation',
                })
              }}
            >
              PFAM SARS-CoV2 multi-stockholm
            </ListItem>
            <ListItem
              model={model}
              onClick={() => {
                model.setMSAFilehandle({
                  uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/Lysine.stock',
                  locationType: 'UriLocation',
                })
              }}
            >
              Lysine stockholm file
            </ListItem>
            <ListItem
              model={model}
              onClick={() => {
                model.setMSAFilehandle({
                  uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/PF01601_full.txt',
                  locationType: 'UriLocation',
                })
              }}
            >
              PF01601 stockholm file (SARS-CoV2 spike protein)
            </ListItem>
            <ListItem
              model={model}
              onClick={() => {
                model.setMSAFilehandle({
                  uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/europe_covid.fa',
                  locationType: 'UriLocation',
                })
              }}
            >
              Europe COVID full genomes (LR883044.1 and 199 other sequences)
            </ListItem>
            <ListItem
              model={model}
              onClick={() => {
                transaction(() => {
                  model.setMSAFilehandle({
                    uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.fa',
                    locationType: 'UriLocation',
                  })
                  model.setTreeFilehandle({
                    uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.nh',
                    locationType: 'UriLocation',
                  })
                })
              }}
            >
              MAFFT+VeryFastTree(17.9k samples)
            </ListItem>
          </ul>
        </Grid>
      </Grid>
    </Container>
  )
})
