import React, { useState } from 'react'
import { IconButton, Select, Typography } from '@mui/material'
import { observer } from 'mobx-react'

// locals
import { MsaViewModel } from '../model'
import SettingsDialog from './SettingsDlg'
import AboutDialog from './AboutDlg'
import DetailsDialog from './DetailsDlg'
import TracklistDialog from './TracklistDlg'

// icons
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import HelpIcon from '@mui/icons-material/Help'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ListIcon from '@mui/icons-material/List'
import { ZoomIn, ZoomOut } from '@mui/icons-material'

const InfoArea = observer(({ model }: { model: MsaViewModel }) => {
  const { mouseOverRowName, mouseCol } = model
  return (
    <div>
      <Typography display="inline">Row name: {mouseOverRowName}</Typography>
      <span style={{ marginLeft: 10 }} />
      <Typography display="inline">Position: {mouseCol}</Typography>
    </div>
  )
})

const Header = observer(({ model }: { model: MsaViewModel }) => {
  const [settingsDialogViz, setSettingsDialogViz] = useState(false)
  const [aboutDialogViz, setAboutDialogViz] = useState(false)
  const [detailsDialogViz, setDetailsDialogViz] = useState(false)
  const [tracklistDialogViz, setTracklistDialogViz] = useState(false)
  const { currentAlignment, alignmentNames } = model

  return (
    <div style={{ display: 'flex' }}>
      <IconButton
        onClick={async () => {
          try {
            model.setData({ tree: '', msa: '' })
            await model.setTreeFilehandle(undefined)
            await model.setMSAFilehandle(undefined)
            model.setScrollY(0)
            model.setScrollX(0)
            model.setCurrentAlignment(0)
          } catch (e) {
            console.error(e)
            model.setError(e)
          }
        }}
      >
        <FolderOpenIcon />
      </IconButton>
      <IconButton onClick={() => setSettingsDialogViz(true)}>
        <SettingsIcon />
      </IconButton>
      <IconButton onClick={() => setDetailsDialogViz(true)}>
        <AssignmentIcon />
      </IconButton>
      <IconButton onClick={() => setTracklistDialogViz(true)}>
        <ListIcon />
      </IconButton>
      {settingsDialogViz ? (
        <SettingsDialog
          open
          model={model}
          onClose={() => setSettingsDialogViz(false)}
        />
      ) : null}
      {aboutDialogViz ? (
        <AboutDialog open onClose={() => setAboutDialogViz(false)} />
      ) : null}
      {detailsDialogViz ? (
        <DetailsDialog
          open
          model={model}
          onClose={() => setDetailsDialogViz(false)}
        />
      ) : null}

      {tracklistDialogViz ? (
        <TracklistDialog
          open
          model={model}
          onClose={() => setTracklistDialogViz(false)}
        />
      ) : null}
      {alignmentNames.length > 0 ? (
        <Select
          native
          value={currentAlignment}
          size="small"
          onChange={event => {
            model.setCurrentAlignment(+(event.target.value as string))
            model.setScrollX(0)
            model.setScrollY(0)
          }}
        >
          {alignmentNames.map((option, index) => (
            <option key={`${option}-${index}`} value={index}>
              {option}
            </option>
          ))}
        </Select>
      ) : null}
      <IconButton
        onClick={() => {
          model.setColWidth(Math.ceil(model.colWidth * 1.5))
          model.setRowHeight(Math.ceil(model.rowHeight * 1.5))
        }}
      >
        <ZoomIn />
      </IconButton>
      <IconButton
        onClick={() => {
          model.setColWidth(Math.max(1, Math.floor(model.colWidth * 0.75)))
          model.setRowHeight(Math.max(1, Math.floor(model.rowHeight * 0.75)))
        }}
      >
        <ZoomOut />
      </IconButton>
      <InfoArea model={model} />
      <div style={{ flex: 1 }} />
      <IconButton onClick={() => setAboutDialogViz(true)}>
        <HelpIcon />
      </IconButton>
    </div>
  )
})

export default Header
