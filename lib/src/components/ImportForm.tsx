import React, { useState } from 'react'
import { Button, Container, Grid, Typography, Link } from '@material-ui/core'
import { observer } from 'mobx-react'
import { transaction } from 'mobx'
import { FileSelector } from '@jbrowse/core/ui'
import { MsaViewModel } from '../model'
import { smallTree, smallMSA } from './data/seq2'

export default observer(({ model }: { model: MsaViewModel }) => {
  const [msaFile, setMsaFile] = useState()
  const [treeFile, setTreeFile] = useState()

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
          <FileSelector
            location={msaFile}
            //@ts-ignore
            setLocation={setMsaFile}
            localFileAllowed
          />
          <Typography>Tree file or URL</Typography>
          <FileSelector
            location={treeFile}
            //@ts-ignore
            setLocation={setTreeFile}
            localFileAllowed
          />
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
              <Link
                href="#"
                onClick={() => {
                  model.setTreeFilehandle({
                    uri: 'https://jbrowse.org/genomes/newick_trees/sarscov2phylo.pub.ft.nh',
                  })
                }}
              >
                230k COVID-19 samples (tree only)
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  model.setData({ msa: smallMSA, tree: smallTree })
                }}
              >
                Small protein+tree
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  model.setMSAFilehandle({
                    uri: 'https://ihh.github.io/abrowse/build/pfam-cov2.stock',
                  })
                }}
              >
                PFAM SARS-CoV2 multi-stockholm
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  model.setMSAFilehandle({
                    uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/Lysine.stock',
                  })
                }}
              >
                Lysine stockholm file
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  model.setMSAFilehandle({
                    uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/PF01601_full.txt',
                  })
                }}
              >
                PF01601 stockholm file (SARS-CoV2 spike protein)
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  model.setMSAFilehandle({
                    uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/europe_covid.fa',
                  })
                }}
              >
                Europe COVID full genomes (LR883044.1 and 199 other sequences)
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => {
                  transaction(() => {
                    model.setMSAFilehandle({
                      uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.fa',
                    })
                    model.setTreeFilehandle({
                      uri: 'https://jbrowse.org/genomes/multiple_sequence_alignments/rhv_test-only.aligned_with_mafft_auto.nh',
                    })
                  })
                }}
              >
                MAFFT+VeryFastTree(17.9k samples)
              </Link>
            </li>
          </ul>
        </Grid>
      </Grid>
    </Container>
  )
})
