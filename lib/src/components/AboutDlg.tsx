import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Link,
} from '@material-ui/core'

function LicenseDialog({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  return (
    <Dialog onClose={() => onClose()} open={open}>
      <DialogTitle>Biotite License</DialogTitle>
      <DialogContent>
        <pre style={{ height: 100, overflow: 'auto' }}>
          {`
Copyright 2017 - 2020, The Biotite contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
may be used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        `}
        </pre>
      </DialogContent>
    </Dialog>
  )
}
export default function AboutDialog({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  const [dlgOpen, setDlgOpen] = useState(false)
  return (
    <>
      <LicenseDialog onClose={() => setDlgOpen(false)} open={dlgOpen} />
      <Dialog onClose={() => onClose()} open={open}>
        <DialogTitle>About this plugin</DialogTitle>
        <DialogContent>
          <Typography>
            JBrowse 2 MSAView plugin v1.0.0 (
            <Link href="https://github.com/gmod/jbrowse-plugin-msaview">
              Github
            </Link>
            )
          </Typography>

          <ul>
            <li>
              We use some color schemes from the{' '}
              <Link href="https://github.com/biotite-dev/biotite">biotite</Link>{' '}
              project, and their license is reproduced{' '}
              <Link onClick={() => setDlgOpen(true)}>here</Link>
            </li>
            <li>
              See this page for some information on jalview colorings{' '}
              <Link href="https://www.jalview.org/help/html/colourSchemes/">
                here
              </Link>
            </li>
            <li>
              See this page for some info on the clustal, cinema, maeditor, and
              lesk color schemes{' '}
              <Link href="http://www.bioinformatics.nl/~berndb/aacolour.html">
                here
              </Link>
            </li>
            <li>
              See this paper about the flower color scheme{' '}
              <Link href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7245768/">
                here
              </Link>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
