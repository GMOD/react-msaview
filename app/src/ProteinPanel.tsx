import React, { useCallback, useState, useEffect, useRef } from 'react'
import { getSnapshot } from 'mobx-state-tree'
import { observer } from 'mobx-react'
import { Button, Select, MenuItem, TextField } from '@mui/material'
import { Stage, StaticDatasource, DatasourceRegistry } from 'ngl'
import { AppModel } from './model'
import { getOffset } from './util'

DatasourceRegistry.add(
  'data',
  new StaticDatasource('https://files.rcsb.org/download/'),
)

export interface IResidueProxy {
  index: number
  resno: number
  atomOffset: number
  qualifiedName: () => string
}
export interface IStructure {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAtomProxy: () => any
  getResidueProxy: () => IResidueProxy
  residueStore: {
    count: number
  }
}
export interface IRes {
  structure: IStructure
  removeAllRepresentations: () => void
  addRepresentation: (arg: string, obj: { sele: string }) => void
  removeAnnotation: (arg: unknown) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addAnnotation: (arg0: any, arg: string) => unknown
}

interface IPickingProxy {
  atom: {
    resno: number
    chainname: string
  }
  bond: string
  closestBondAtom: string
  picker: { structure: { name: string } }
}

interface IStage {
  viewer: {
    requestRender: () => void
  }
  dispose: () => void
  loadFile: (arg: string) => IRes
  autoView: () => void
  handleResize: () => void
  signals: {
    hovered: {
      add: (arg: (arg: IPickingProxy) => void) => void
    }
  }
}

const ProteinPanel = observer(function ({ model }: { model: AppModel }) {
  const annotations = useRef<unknown[]>([])
  const [type, setType] = useState('cartoon')
  const [res, setRes] = useState<IRes[]>([])
  const [stage, setStage] = useState<IStage>()
  const [isMouseHovering, setMouseHovering] = useState(false)
  const { msaview, nglSelection } = model
  const { selectedStructures, mouseCol } = msaview
  const structures = getSnapshot(selectedStructures)

  const stageElementRef = useCallback((element: HTMLDivElement) => {
    if (element) {
      const currentStage = new Stage(element)
      setStage(currentStage)
    }
  }, [])

  useEffect(() => {
    return () => stage?.dispose()
  }, [stage])

  useEffect(() => {
    if (!structures.length || !stage) {
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      // Handle window resizing
      window.addEventListener('resize', () => {
        stage.handleResize()
      })

      const res = await Promise.all(
        structures.map(selection => {
          return stage.loadFile(`data://${selection.structure.pdb}.pdb`)
        }),
      )
      setRes(res)

      stage.signals.hovered.add(pickingProxy => {
        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          const atom = pickingProxy.atom || pickingProxy.closestBondAtom
          msaview.setMouseoveredColumn(
            atom.resno - structures[0]?.structure.startPos,
            atom.chainname,
            pickingProxy.picker.structure.name,
          )
        }
      })
    })()
  }, [msaview, structures, stage])

  useEffect(() => {
    if (stage) {
      for (const elt of res) {
        elt.removeAllRepresentations()
        elt.addRepresentation(type, { sele: nglSelection })
      }
      stage.autoView()
    }
  }, [type, res, stage, nglSelection])

  useEffect(() => {
    if (structures.length && !isMouseHovering) {
      res.forEach((elt, index) => {
        if (annotations.current.length) {
          elt.removeAnnotation(annotations.current[index])
        }
        annotations.current = []
        if (mouseCol !== undefined) {
          const offset = getOffset(
            model,
            structures[index].id,
            elt.structure,
            mouseCol,
            structures[0].structure.startPos,
          )
          if (offset) {
            const ap = elt.structure.getAtomProxy()
            ap.index = offset.atomOffset

            annotations.current.push(
              elt.addAnnotation(ap.positionToVector3(), offset.qualifiedName()),
            )
          }
        }
        stage?.viewer.requestRender()
      })
    }
  }, [model, mouseCol, structures, stage?.viewer, res, isMouseHovering])

  return selectedStructures.length ? (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          onClick={() => msaview.clearSelectedStructures()}
          variant="contained"
        >
          Clear
        </Button>

        <div style={{ width: 20 }} />
        <Select value={type} onChange={event => setType(event.target.value)}>
          <MenuItem value={'cartoon'}>cartoon</MenuItem>
          <MenuItem value={'ball+stick'}>ball+stick</MenuItem>
        </Select>
        <div style={{ width: 20 }} />
        <TextField
          variant="outlined"
          label="Selection"
          value={nglSelection}
          onChange={event => model.setNGLSelection(event.target.value)}
        />
      </div>

      <div
        ref={stageElementRef}
        style={{ width: 600, height: 400 }}
        onMouseEnter={() => setMouseHovering(true)}
        onMouseLeave={() => setMouseHovering(false)}
      />
    </div>
  ) : null
})

export default ProteinPanel
