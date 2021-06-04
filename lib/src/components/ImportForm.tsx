import React, { useState } from 'react'
import { Button, Container, Grid, Typography, Link } from '@material-ui/core'
import { observer } from 'mobx-react'
import { transaction } from 'mobx'
import { FileSelector } from '@jbrowse/core/ui'
import { FileLocation } from '@jbrowse/core/util/types'
import { MsaViewModel } from '../model'
import { smallTree, smallMSA } from './data/seq2'

const Li = ({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) => (
  <Link onClick={onClick} href="#">
    <Typography>{children}</Typography>
  </Link>
)
export default observer(({ model }: { model: MsaViewModel }) => {
  const [msaFile, setMsaFile] = useState<FileLocation>()
  const [treeFile, setTreeFile] = useState<FileLocation>()

  return (
    <Container>
      <div style={{ width: '50%' }}>
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

      <Grid container spacing={10} justify="center" alignItems="center">
        <Grid item>
          <Typography>MSA file or URL</Typography>
          <FileSelector location={msaFile} setLocation={setMsaFile} />
          <Typography>Tree file or URL</Typography>
          <FileSelector location={treeFile} setLocation={setTreeFile} />
        </Grid>

        <Grid item>
          <Button
            onClick={() => {
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
            <li>
              <Li
                onClick={() => {
                  model.setTreeFilehandle({
                    uri:
                      'https://jbrowse.org/genomes/newick_trees/sarscov2phylo.pub.ft.nh',
                  })
                }}
              >
                230k COVID-19 samples (tree only)
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  model.setData({ msa: smallMSA, tree: smallTree })
                }}
              >
                Small protein+tree
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  model.setMSAFilehandle({
                    uri: 'https://ihh.github.io/abrowse/build/pfam-cov2.stock',
                  })
                }}
              >
                PFAM SARS-CoV2 multi-stockholm
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  model.setMSAFilehandle({
                    uri:
                      'https://jbrowse.org/genomes/multiple_sequence_alignments/Lysine.stock',
                  })
                }}
              >
                Lysine stockholm file
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  model.setMSAFilehandle({
                    uri:
                      'https://jbrowse.org/genomes/multiple_sequence_alignments/PF01601_full.txt',
                  })
                }}
              >
                PF01601 stockholm file (SARS-CoV2 spike protein)
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  model.setMSAFilehandle({
                    uri:
                      'https://jbrowse.org/genomes/multiple_sequence_alignments/europe_covid.fa',
                  })
                }}
              >
                Europe COVID full genomes (LR883044.1 and 199 other sequences)
              </Li>
            </li>
            <li>
              <Li
                onClick={() => {
                  transaction(() => {
                    model.setMSAFilehandle({
                      uri:
                        'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.fa',
                    })
                    model.setTreeFilehandle({
                      uri:
                        'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.nh',
                    })
                  })
                }}
              >
                MAFFT+VeryFastTree(17.9k samples)
              </Li>
            </li>
          </ul>
        </Grid>
      </Grid>
    </Container>
  )
})
