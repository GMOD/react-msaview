import React, { useState } from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { DialogContent } from '@mui/material'
import { MsaViewModel } from '../../model'

// 4 colors:
// 15 105 195 285 375
// 15 105 195 285
function p(n: number) {
  const hues = Array.from(
    { length: n + 1 },
    (_, i) => 15 + (i * (375 - 15)) / n,
  )
  console.log({ hues }, n, hues.length)
  return hues.map(h => `lch(65% 100 ${h})`).slice(0, n)
}

export default function FeatureTypeDialog({
  onClose,
  model,
}: {
  onClose: () => void
  model: MsaViewModel
}) {
  const { interProTerms } = model
  const [val, setVal] = useState(false)
  const palette = p(4) //[...interProTerms.values()].length)
  return (
    <Dialog onClose={() => onClose()} open title="Feature types" maxWidth="xl">
      <DialogContent>
        <table>
          <thead>
            <tr>
              <td></td>
              <td>accession</td>
              <td>name</td>
              <td>description</td>
            </tr>
          </thead>
          <tbody>
            {[...interProTerms.values()].map((term, idx) => {
              return (
                <tr key={term.accession}>
                  <td>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={event => setVal(event.target.checked)}
                    />
                  </td>
                  <td>{term.accession}</td>
                  <td>{term.name}</td>
                  <td>{term.description}</td>
                  <td>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        background: palette[idx],
                      }}
                    ></div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  )
}
