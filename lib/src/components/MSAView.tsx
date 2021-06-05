import React, { useState, useEffect } from 'react'

import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'
import { Typography } from '@material-ui/core'

import ImportForm from './ImportForm'
import TreeCanvas from './TreeCanvas'
import MSACanvas from './MSACanvas'
import Ruler from './Ruler'
import Annotations from './Annotations'
import TreeRuler from './TreeRuler'
import Header from './Header'

const resizeHandleWidth = 5

export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized, treeAreaWidth, height } = model
  const [cropMouseDown, setCropMouseDown] = useState(false)

  // this has the effect of just "cropping" the tree area
  useEffect(() => {
    if (cropMouseDown) {
      const listener = (event: MouseEvent) => {
        model.setTreeAreaWidth(model.treeAreaWidth + event.movementX)
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
  }, [cropMouseDown, model])

  return !initialized ? (
    <ImportForm model={model} />
  ) : !done ? (
    <Typography variant="h4">Loading...</Typography>
  ) : (
    <div style={{ height, overflow: 'hidden' }}>
      <Header model={model} />
      <div>
        <div style={{ display: 'flex', height: 20 }}>
          <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
            <TreeRuler model={model} />
          </div>

          <div style={{ width: resizeHandleWidth }}></div>
          <Ruler model={model} />
        </div>

          <div style={{ display: 'flex', height: 20 }}>
            <div style={{ overflow: 'hidden', width: treeAreaWidth }} />
            <div style={{ width: resizeHandleWidth }}></div>
            <Annotations model={model} />
          </div>
          <div


        <div
          style={{
            display: 'flex',
          }}
        >
          <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
            <TreeCanvas model={model} />
          </div>
          <div>
            <div
              onMouseDown={() => {
                setCropMouseDown(true)
              }}
              style={{
                cursor: 'ew-resize',
                height: '100%',
                width: resizeHandleWidth,
                background: `rgba(200,200,200)`,
                position: 'relative',
              }}
            />
          </div>
          <MSACanvas model={model} />
        </div>
      </div>
    </div>
  )
})
