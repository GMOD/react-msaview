import React, { useState, useEffect } from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Ruler from './Ruler'
import TreeRuler from './TreeRuler'
import Header from './Header'
export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized } = model
  const [mouseDown, setMouseDown] = useState(false)
  const [cropMouseDown, setCropMouseDown] = useState(false)

  // this has the effect of making the tree smaller
  useEffect(() => {
    if (mouseDown) {
      const listener = (event: MouseEvent) =>
        model.setTreeWidth(model.treeAreaWidth + event.movementX)

      const listener2 = () => setMouseDown(false)

      document.addEventListener('mousemove', listener)
      document.addEventListener('mouseup', listener2)
      return () => {
        document.removeEventListener('mousemove', listener)
        document.removeEventListener('mouseup', listener2)
      }
    }
    return () => {}
  }, [mouseDown])

  // this has the effect of just "cropping" the tree area
  useEffect(() => {
    if (cropMouseDown) {
      const listener = (event: MouseEvent) => {
        model.setNameWidth(model.nameWidth + event.movementX)
        model.setTreeWidth(model.treeAreaWidth + event.movementX)
      }

      const listener2 = () => setCropMouseDown(false)

      document.addEventListener('mousemove', listener)
      document.addEventListener('mouseup', listener2)
      return () => {
        document.removeEventListener('mousemove', listener)
        document.removeEventListener('mouseup', listener2)
      }
    }
    return () => {}
  }, [cropMouseDown])

  if (!initialized) {
    return <ImportForm model={model} />
  } else if (!done) {
    return <Typography variant="h4">Loading...</Typography>
  } else {
    const { height } = model

    return (
      <div style={{ height, overflow: 'hidden' }}>
        <Header model={model} />
        <div>
          <div style={{ display: 'flex', height: 20 }}>
            <TreeRuler model={model} />
            <Ruler model={model} />
          </div>
          <div
            style={{
              display: 'flex',
            }}
          >
            <TreeCanvas model={model} />
            <div>
              <div
                onMouseDown={() => {
                  setCropMouseDown(true)
                }}
                style={{
                  cursor: 'ew-resize',
                  height: '50%',
                  border: '3px solid rgba(40,200,40)',
                }}
              />
              <div
                onMouseDown={() => {
                  setMouseDown(true)
                }}
                style={{
                  cursor: 'ew-resize',
                  height: '50%',
                  border: '3px solid rgba(200,40,40)',
                }}
              />
            </div>
            <MSACanvas model={model} />
          </div>
        </div>
      </div>
    )
  }
})
