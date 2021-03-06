import React, { useState } from 'react'
import { IconButton, Select, Typography } from '@material-ui/core'
import { MsaViewModel } from '../model'
import { observer } from 'mobx-react'

import SettingsDialog from './SettingsDlg'
import AboutDialog from './AboutDlg'
import DetailsDialog from './DetailsDlg'
import TracklistDialog from './TracklistDlg'

//icons
import FolderOpenIcon from '@material-ui/icons/FolderOpen'
import SettingsIcon from '@material-ui/icons/Settings'
import HelpIcon from '@material-ui/icons/Help'
import AssignmentIcon from '@material-ui/icons/Assignment'
import ListIcon from '@material-ui/icons/List'

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
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false)
  const [aboutDialogVisible, setAboutDialogVisible] = useState(false)
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false)
  const [tracklistDialogVisible, setTracklistDialogVisible] = useState(false)
  const { currentAlignment, alignmentNames } = model

  return (
    <div style={{ display: 'flex' }}>
      <IconButton
        onClick={() => {
          model.setData({ tree: '', msa: '' })
          model.setTreeFilehandle(undefined)
          model.setMSAFilehandle(undefined)
          model.setScrollY(0)
          model.setScrollX(0)
          model.setCurrentAlignment(0)
        }}
      >
        <FolderOpenIcon />
      </IconButton>
      <IconButton onClick={() => setSettingsDialogVisible(true)}>
        <SettingsIcon />
      </IconButton>
      <IconButton onClick={() => setDetailsDialogVisible(true)}>
        <AssignmentIcon />
      </IconButton>
      <IconButton onClick={() => setTracklistDialogVisible(true)}>
        <ListIcon />
      </IconButton>
      {settingsDialogVisible ? (
        <SettingsDialog
          open
          model={model}
          onClose={() => setSettingsDialogVisible(false)}
        />
      ) : null}
      {aboutDialogVisible ? (
        <AboutDialog open onClose={() => setAboutDialogVisible(false)} />
      ) : null}
      {detailsDialogVisible ? (
        <DetailsDialog
          open
          model={model}
          onClose={() => setDetailsDialogVisible(false)}
        />
      ) : null}

      {tracklistDialogVisible ? (
        <TracklistDialog
          open
          model={model}
          onClose={() => setTracklistDialogVisible(false)}
        />
      ) : null}
      {alignmentNames.length > 0 ? (
        <Select
          native
          value={currentAlignment}
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
      <InfoArea model={model} />
      <div style={{ flex: 1 }} />
      <IconButton onClick={() => setAboutDialogVisible(true)}>
        <HelpIcon />
      </IconButton>
    </div>
  )
})

export default Header
