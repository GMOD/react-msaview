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

const resizeHandleWidth = 5

export default observer(({ model }: { model: MsaViewModel }) => {
  const { done, initialized, treeAreaWidth } = model
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
            <div style={{ overflow: 'hidden', width: treeAreaWidth }}>
              <TreeRuler model={model} />
            </div>

            <div style={{ width: resizeHandleWidth }}></div>
            <Ruler model={model} />
          </div>
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
              >
                <div
                  style={{
                    overflow: 'hidden',
                    position: 'absolute',
                    top: '49%',
                    height: 19,
                    width: 1,
                    left: resizeHandleWidth / 2 - 0.5,
                    background: 'grey',
                    zIndex: 20,
                  }}
                />
              </div>
            </div>
            <MSACanvas model={model} />
          </div>
        </div>
      </div>
    )
  }
})
