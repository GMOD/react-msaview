import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { MsaViewModel } from '../model'
import { IconButton, Menu, MenuItem } from '@material-ui/core'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'

export const TrackLabel = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const [anchorEl, setAnchorEl] = useState<Element>()
    const { rowHeight, treeAreaWidth: width } = model
    const { height, name } = track

    return (
      <div
        style={{
          width,
          height,
          textAlign: 'right',
          fontSize: Math.max(8, rowHeight - 8),
        }}
      >
        {name}
        <IconButton
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
                model.toggleTrack(track)
                setAnchorEl(undefined)
              }}
            >
              Close
            </MenuItem>
          </Menu>
        ) : null}
      </div>
    )
  },
)

const Track = observer(
  ({ model, track }: { model: MsaViewModel; track: any }) => {
    const { resizeHandleWidth } = model
    const { height } = track
    return (
      <div key={track.id} style={{ display: 'flex', height }}>
        <TrackLabel model={model} track={track} />
        <div style={{ width: resizeHandleWidth }} />
        <track.ReactComponent model={model} track={track} />
      </div>
    )
  },
)

export default Track
