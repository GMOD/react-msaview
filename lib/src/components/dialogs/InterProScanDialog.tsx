import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import { Button, DialogActions, DialogContent, Typography } from '@mui/material'

// locals
import { MsaViewModel } from '../../model'
import SequenceTextArea from '../SequenceTextArea'

const FeatureTypeDialog = observer(function ({
  onClose,
  model,
}: {
  onClose: () => void
  model: MsaViewModel
}) {
  const [vals, setVals] = useState([
    {
      name: 'NCBIfam',
      description: 'NCBI RefSeq FAMs including TIGRFAMs',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'SFLD',
      description: 'Structure function linkage database',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'Phobius',
      checked: true,
      description:
        'A combined transmembrane topology and signal peptide predictor',
      category: 'Other sequence features',
    },
    {
      name: 'SignalP',
      checked: true,
      category: 'Other sequence features',
    },
    {
      name: 'SignalP_EUK',
      category: 'Other category',
      checked: true,
    },
    {
      name: 'SignalP_GRAM_POSITIVE',
      category: 'Other category',
      checked: true,
    },
    {
      name: 'SignalP_GRAM_NEGATIVE',
      checked: true,
      category: 'Other category',
    },
    {
      name: 'SUPERFAMILY',
      category: 'Structural domains',
      checked: true,
    },
    {
      name: 'PANTHER',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'Gene3D',
      category: 'Structural domains',
      checked: true,
    },
    {
      name: 'Hamap',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'ProSiteProfiles',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'ProSitePatterns',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'Coils',
      category: 'Other sequence features',
      checked: true,
    },
    {
      name: 'SMART',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'CDD',
      description: 'Conserved Domains Database',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'PRINTS',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'Pfam',
      category: 'Families, domains, sites & repeats',
      checked: true,
    },
    {
      name: 'MobiDBLite',
      checked: true,
      category: 'Other sequence features',
    },
    {
      name: 'PIRSF',
      checked: true,
      category: 'Other category',
    },
    {
      name: 'TMHMM',
      checked: true,
      category: 'Other sequence features',
    },

    {
      name: 'AntiFam',
      checked: true,
      category: 'Other category',
    },
    {
      name: 'FunFam',
      checked: true,
      category: 'Other category',
    },
    {
      name: 'PIRSR',
      checked: true,
      category: 'Families, domains, sites & repeats',
    },
  ])

  const programs = vals.filter(e => e.checked).map(e => e.name)
  const [show, setShow] = useState(false)

  return (
    <Dialog onClose={() => onClose()} open title="Feature types" maxWidth="xl">
      <DialogContent>
        <Typography>
          This will run InterProScan on all rows of the current MSA
        </Typography>
        <Button onClick={() => setShow(!show)}>
          {show ? 'Hide' : 'Show'} advanced options
        </Button>
        {show ? (
          <div>
            <Typography>Select algorithms for InterProScan to run</Typography>
            <div>
              <Button
                variant="contained"
                color="secondary"
                onClick={() =>
                  setVals(vals.map(v => ({ ...v, checked: false })))
                }
              >
                Select none
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  setVals(vals.map(v => ({ ...v, checked: true })))
                }
              >
                Select all
              </Button>
            </div>
            <table>
              <tbody>
                {vals
                  .sort((a, b) => a.category.localeCompare(b.category))
                  .map(({ name, checked, category }) => (
                    <tr key={name}>
                      <td>
                        <input
                          type="checkbox"
                          key={name}
                          checked={checked}
                          onChange={() =>
                            setVals(
                              vals.map(e =>
                                e.name === name
                                  ? { ...e, checked: !e.checked }
                                  : e,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>{name}</td>
                      <td>{category}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            model.queryInterProScan(programs).catch(e => model.setError(e))
            onClose()
          }}
        >
          Send sequences to InterProScan
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default FeatureTypeDialog
