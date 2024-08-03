import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Button, Container, Grid, Typography } from '@mui/material'
import { FileSelector } from '@jbrowse/core/ui'
import type { FileLocation } from '@jbrowse/core/util/types'

// locals
import type { MsaViewModel } from '../../model'
import { load } from './util'
import ImportFormExamples from './ImportFormExamples'

export default observer(function ({ model }: { model: MsaViewModel }) {
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
            onClick={() => load(model, msaFile, treeFile)}
            variant="contained"
            color="primary"
            disabled={!msaFile && !treeFile}
          >
            Open
          </Button>
        </Grid>

        <Grid item>
          <Typography>Examples</Typography>
          <ImportFormExamples model={model} />
        </Grid>
      </Grid>
    </Container>
  )
})
