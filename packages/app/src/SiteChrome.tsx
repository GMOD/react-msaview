import { useEffect, useRef, useState } from 'react'

import ContentCopy from '@mui/icons-material/ContentCopy'
import LinkOff from '@mui/icons-material/LinkOff'
import ViewInAr from '@mui/icons-material/ViewInAr'
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

export function SiteNav() {
  return (
    <Box
      component="nav"
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        columnGap: 2,
        px: 1.5,
        py: 0.5,
        fontSize: 14,
        bgcolor: 'grey.100',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography component="h1" sx={{ fontSize: 15, fontWeight: 600 }}>
        JBrowseMSA
      </Typography>
      <Link href="../">Docs</Link>
      <Link href="../tutorials/">Tutorials</Link>
      <Link href="../examples/">Examples</Link>
    </Box>
  )
}

export function AppActions({
  model,
  structureOpen,
  onToggleStructure,
}: {
  model: AppModel
  structureOpen: boolean
  onToggleStructure: () => void
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, px: 1, flexShrink: 0 }}>
      <Button
        size="small"
        startIcon={<ViewInAr />}
        color={structureOpen ? 'primary' : 'inherit'}
        variant={structureOpen ? 'outlined' : 'text'}
        aria-pressed={structureOpen}
        onClick={onToggleStructure}
      >
        3D structure
      </Button>
      <CopyLinkButton model={model} />
    </Box>
  )
}
