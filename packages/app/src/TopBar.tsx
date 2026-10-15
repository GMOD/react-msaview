import { useEffect, useRef, useState } from 'react'

import ContentCopy from '@mui/icons-material/ContentCopy'
import LinkOff from '@mui/icons-material/LinkOff'
import { Box, Button, Link, Tooltip, Typography } from '@mui/material'
import { observer } from 'mobx-react'

import { shareLink } from './model'

import type { AppModel } from './model'

// A ClipboardItem takes the text as a promise, which keeps the click's user
// activation alive while the snapshot compresses
function writeClipboard(text: Promise<string>) {
  return typeof ClipboardItem === 'undefined'
    ? text.then(t => navigator.clipboard.writeText(t))
    : navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': text.then(t => new Blob([t], { type: 'text/plain' })),
        }),
      ])
}

const CopyLinkButton = observer(function ({ model }: { model: AppModel }) {
  const [flash, setFlash] = useState<string>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    [],
  )
  const { linkProblem } = model

  function show(text: string) {
    setFlash(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setFlash(undefined)
    }, 1500)
  }

  return (
    <Tooltip title={linkProblem ?? 'Copy a link that opens this view'}>
      <span>
        <Button
          size="small"
          variant="contained"
          disabled={!!linkProblem}
          startIcon={linkProblem ? <LinkOff /> : <ContentCopy />}
          onClick={() => {
            const link = shareLink(model, window.location.href)
            void writeClipboard(
              link.then(l => l.url ?? Promise.reject(new Error(l.problem))),
            ).then(
              () => {
                show('Copied')
              },
              () =>
                link.then(({ problem }) => {
                  model.setLinkProblem(problem)
                  if (!problem) {
                    show('Copy failed')
                  }
                }),
            )
          }}
        >
          {flash ?? 'Copy link'}
        </Button>
      </span>
    </Tooltip>
  )
})

export default function TopBar({
  model,
  structureOpen,
  onToggleStructure,
}: {
  model: AppModel
  structureOpen: boolean
  onToggleStructure: () => void
}) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 2,
        rowGap: 1,
        px: 2.5,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography component="h1" sx={{ fontSize: 18, fontWeight: 600 }}>
        JBrowseMSA
      </Typography>
      <Link href="../">Docs</Link>
      <Link href="../tutorials/">Tutorials</Link>
      <Link href="../examples/">Examples</Link>
      <Box sx={{ flexGrow: 1 }} />
      <Button
        size="small"
        variant="outlined"
        color="primary"
        aria-pressed={structureOpen}
        onClick={onToggleStructure}
        sx={structureOpen ? { borderWidth: 2, fontWeight: 700 } : undefined}
      >
        3D structure
      </Button>
      <CopyLinkButton model={model} />
    </Box>
  )
}
