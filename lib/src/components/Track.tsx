import React, { useState, useRef, useEffect } from 'react'
import normalizeWheel from 'normalize-wheel'

import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import { IconButton, Menu, MenuItem, makeStyles } from '@material-ui/core'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import TrackInfoDialog from './TrackInfoDlg'

const useStyles = makeStyles(() => ({
  button: {
    padding: 0,
  },
}))

export const TrackLabel = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const [anchorEl, setAnchorEl] = useState<Element>()
    const [trackInfoDlgOpen, setTrackInfoDlgOpen] = useState(false)
    const { rowHeight, treeAreaWidth: width } = model
    const {
      height,
      model: { name },
    } = track
    const classes = useStyles()
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
        {name}
        <IconButton
          className={classes.button}
          style={{ width: trackLabelHeight, height: trackLabelHeight }}
          onClick={event => {
            setAnchorEl(event.target as Element)
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
                setTrackInfoDlgOpen(true)
                setAnchorEl(undefined)
              }}
            >
              Get info
            </MenuItem>
          </Menu>
        ) : null}
        {trackInfoDlgOpen ? (
          <TrackInfoDialog
            model={track.model}
            onClose={() => setTrackInfoDlgOpen(false)}
          />
        ) : null}
      </div>
    )
  },
)

const Track = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { resizeHandleWidth } = model
    const {
      model: { height },
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
          <track.ReactComponent model={model} track={track} />
        </div>
      </div>
    )
  },
)

export default Track
