import React, { lazy, useEffect, useRef, useState } from 'react'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { IconButton, Menu, MenuItem } from '@mui/material'
import { observer } from 'mobx-react'
import normalizeWheel from 'normalize-wheel'
import { makeStyles } from 'tss-react/mui'



import type { MsaViewModel } from '../model'

// lazies
const TrackInfoDialog = lazy(() => import('./dialogs/TrackInfoDialog'))

const useStyles = makeStyles()({
  button: {
    padding: 0,
  },
})

export const TrackLabel = observer(function ({
  model,
  track,
}: {
  model: MsaViewModel

  track: any
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>()
  const { drawLabels, rowHeight, treeAreaWidth: width } = model
  const {
    height,
    model: { name },
  } = track
  const { classes } = useStyles()
  const trackLabelHeight = Math.max(8, rowHeight - 8)

  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
        textAlign: 'right',
        fontSize: trackLabelHeight,
      }}
    >
      {drawLabels ? name : ''}{' '}
      <IconButton
        className={classes.button}
        style={{
          width: trackLabelHeight,
          height: trackLabelHeight,
        }}
        onClick={event => {
          setAnchorEl(event.currentTarget)
        }}
      >
        <ArrowDropDownIcon />
      </IconButton>
      {anchorEl ? (
        <Menu
          anchorEl={anchorEl}
          transitionDuration={0}
          open
          onClose={() => {
            setAnchorEl(undefined)
          }}
        >
          <MenuItem
            dense
            onClick={() => {
              model.toggleTrack(track.model.id)
              setAnchorEl(undefined)
            }}
          >
            Close
          </MenuItem>
          <MenuItem
            dense
            onClick={() => {
              model.queueDialog(onClose => [
                TrackInfoDialog,
                { onClose, model: track.model },
              ])
              setAnchorEl(undefined)
            }}
          >
            Get info
          </MenuItem>
        </Menu>
      ) : null}
    </div>
  )
})

const Track = observer(function ({
  model,
  track,
}: {
  model: MsaViewModel

  track: any
}) {
  const { resizeHandleWidth } = model
  const {
    model: { height, error },
  } = track
  const ref = useRef<HTMLDivElement>(null)
  const scheduled = useRef(false)
  const deltaX = useRef(0)
  useEffect(() => {
    const curr = ref.current
    if (!curr) {
      return
    }
    function onWheel(origEvent: WheelEvent) {
      const event = normalizeWheel(origEvent)
      deltaX.current += event.pixelX

      if (!scheduled.current) {
        scheduled.current = true
        requestAnimationFrame(() => {
          model.doScrollX(-deltaX.current)
          deltaX.current = 0
          scheduled.current = false
        })
      }
      origEvent.preventDefault()
    }
    curr.addEventListener('wheel', onWheel)
    return () => {
      curr.removeEventListener('wheel', onWheel)
    }
  }, [model])
  return (
    <div key={track.id} style={{ display: 'flex', height }}>
      <TrackLabel model={model} track={track} />
      <div style={{ width: resizeHandleWidth, flexShrink: 0 }} />
      <div ref={ref}>
        {error ? (
          <div style={{ color: 'red', fontSize: 10 }}>{`${error}`}</div>
        ) : (
          <track.ReactComponent model={model} track={track} />
        )}
      </div>
    </div>
  )
})

export default Track
