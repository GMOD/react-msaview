import React, { useState } from 'react'

import { ErrorMessage, FileSelector } from '@jbrowse/core/ui'
import { Box, Button, Paper, Typography } from '@mui/material'
import { observer } from 'mobx-react'

import ImportFormExamples from './ImportFormExamples.tsx'
import { load } from './util.ts'

import type { MsaViewModel } from '../../model.ts'
import type { FileLocation } from '@jbrowse/core/util/types'

const phone = '@media (max-width: 640px)'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2">{label}</Typography>
      {children}
    </Box>
  )
}

const ImportForm = observer(function ({ model }: { model: MsaViewModel }) {
  const [msaFile, setMsaFile] = useState<FileLocation>()
  const [treeFile, setTreeFile] = useState<FileLocation>()
  const [gffFile, setGffFile] = useState<FileLocation>()
  const { error } = model

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        alignItems: 'start',
        gap: 3,
        p: 3,
        maxWidth: 1000,
        mx: 'auto',
        [phone]: { gridTemplateColumns: 'minmax(0, 1fr)', p: 2 },
      }}
    >
      {error ? (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <ErrorMessage error={error} />
        </Box>
      ) : null}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Open your data</Typography>
        <Typography variant="body2" color="text.secondary">
          An alignment, a tree, or both
        </Typography>
        <Field label="Alignment">
          <FileSelector
            description="FASTA, Stockholm, Clustal, A3M or EMF"
            location={msaFile}
            setLocation={setMsaFile}
          />
        </Field>
        <Field label="Tree">
          <FileSelector
            description="Newick. A Stockholm file can carry its own"
            location={treeFile}
            setLocation={setTreeFile}
          />
        </Field>
        <Field label="Annotations (optional)">
          <FileSelector
            description="GFF3, or the JSON InterProScan returns"
            location={gffFile}
            setLocation={setGffFile}
          />
        </Field>
        <Button
          sx={{ mt: 2 }}
          onClick={() => {
            try {
              load(model, msaFile, treeFile, gffFile)
            } catch (e) {
              console.error(e)
              model.setError(e)
            }
          }}
          variant="contained"
          disabled={!msaFile && !treeFile}
        >
          Open
        </Button>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Examples</Typography>
        <ImportFormExamples model={model} />
      </Paper>
    </Box>
  )
})

export default ImportForm
