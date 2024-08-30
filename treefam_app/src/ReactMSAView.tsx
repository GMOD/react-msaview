import { isAlive } from 'mobx-state-tree'
import useMeasure from '@jbrowse/core/util/useMeasure'
import { useEffect } from 'react'
import AppModel from './model'
import { MSAView } from 'react-msaview'
import { observer } from 'mobx-react'
import { MenuItem, Slider, TextField, Typography } from '@mui/material'
import colorSchemes from './colorSchemes'
import Checkbox2 from './Checkbox2'

// used in ViewContainer files to get the width
function useWidthSetter(view: { setWidth: (arg: number) => void }) {
  const [ref, { width }] = useMeasure()
  useEffect(() => {
    if (width && isAlive(view)) {
      // sets after a requestAnimationFrame
      // https://stackoverflow.com/a/58701523/2129219 avoids ResizeObserver
      // loop error being shown during development
      requestAnimationFrame(() => {
        view.setWidth(width)
      })
    }
  }, [view, width])
  return ref
}

const mymodel = AppModel.create({
  msaview: {
    type: 'MsaView',
  },
})
mymodel.msaview.setHeight(800)

const ReactMSAView = observer(function ({
  msa,
  tree,
  treeMetadata,
}: {
  msa: string
  tree: string
  treeMetadata?: string
}) {
  const ref = useWidthSetter(mymodel.msaview)
  const { msaview } = mymodel
  useEffect(() => {
    mymodel.msaview.setData({
      msa,
      tree,
      treeMetadata,
    })
  }, [msa, tree, treeMetadata])
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div style={{ width: 500 }}>
        <Typography variant="h6">Quick settings panel</Typography>
        <div className="flex">
          <Typography>
            Allowed gappyness ({100 - msaview.allowedGappyness}%)
          </Typography>
          <Slider
            min={1}
            max={100}
            value={msaview.allowedGappyness}
            onChange={(_, val) => {
              msaview.setAllowedGappyness(val as number)
            }}
          />

          <TextField
            select
            label="Color scheme"
            style={{ margin: 20, width: 200 }}
            value={msaview.colorSchemeName}
            onChange={event => {
              msaview.setColorSchemeName(event.target.value)
            }}
          >
            {Object.keys(colorSchemes).map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Checkbox2
            checked={msaview.showBranchLen}
            onChange={() => {
              msaview.setShowBranchLen(!msaview.showBranchLen)
            }}
            label="Show branch length?"
          />
        </div>
      </div>
      <MSAView model={mymodel.msaview} />
    </div>
  )
})

export default ReactMSAView
