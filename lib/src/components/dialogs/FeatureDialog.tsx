import React from 'react'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import { Button, DialogContent } from '@mui/material'

// locals
import { MsaViewModel } from '../../model'

function p(n: number) {
  const hues = Array.from(
    { length: n + 1 },
    (_, i) => 15 + (i * (375 - 15)) / n,
  )
  return hues.map(h => `lch(65% 100 ${h})`).slice(0, n)
}

const Toggles = observer(function ({ model }: { model: MsaViewModel }) {
  const { featureFilters } = model
  return (
    <div>
      <Button
        onClick={() => {
          for (const key of featureFilters.keys()) {
            model.setFilter(key, true)
          }
        }}
      >
        Toggle all on
      </Button>

      <Button
        onClick={() => {
          for (const key of featureFilters.keys()) {
            model.setFilter(key, false)
          }
        }}
      >
        Toggle all off
      </Button>
    </div>
  )
})

const Table = observer(function ({ model }: { model: MsaViewModel }) {
  const { tidyTypes, featureFilters } = model
  const palette = p([...tidyTypes.values()].length)
  return (
    <>
      <Toggles model={model} />
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
          {[...tidyTypes.values()].map(
            ({ accession, name, description }, idx) => (
              <tr key={accession}>
                <td>
                  <input
                    type="checkbox"
                    checked={featureFilters.get(accession) ?? false}
                    onChange={() =>
                      model.setFilter(
                        accession,
                        !model.featureFilters.get(accession),
                      )
                    }
                  />
                </td>
                <td>{accession}</td>
                <td>{name}</td>
                <td>{description}</td>
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
            ),
          )}
        </tbody>
      </table>
    </>
  )
})

const FeatureTypeDialog = observer(function ({
  onClose,
  model,
}: {
  onClose: () => void
  model: MsaViewModel
}) {
  return (
    <Dialog onClose={() => onClose()} open title="Feature types" maxWidth="xl">
      <DialogContent>
        <Table model={model} />
      </DialogContent>
    </Dialog>
  )
})

export default FeatureTypeDialog
